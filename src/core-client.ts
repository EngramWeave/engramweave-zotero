import { Value } from '@sinclair/typebox/value';
import { StatusSchema, CaptureResponseSchema, AnalysisSettingsResponseSchema, type CaptureRequest, type CaptureResponse, type Status } from '@engramweave/contracts';

export interface Connection { base: string; vault: string; token: string }
export interface Transport { (url: string, method: 'GET' | 'POST', token: string, body?: string): Promise<{status:number;json:unknown}> }
const pathKey = (value: string) => value.replaceAll('\\','/').replace(/\/$/,'').toLowerCase();
export class CoreClient {
  constructor(private readonly transport: Transport, private readonly load: () => Promise<Connection>) {}
  private async request(connection: Connection, route: string, body?: CaptureRequest) {
    let response;
    try { response = await this.transport(`${connection.base}${route}`,body ? 'POST' : 'GET',connection.token,body ? JSON.stringify(body) : undefined); }
    catch { throw new Error(body ? 'Core connection interrupted. Delivery may be unknown; retry the same frozen Capture. No operation was automatically repeated.' : 'Cannot connect to Core. Start Core and retry the connection.'); }
    if (response.status < 200 || response.status >= 300) {
      const error = (response.json as {error?:{code?:string;message?:string}})?.error;
      throw new Error(`${error?.code ?? `HTTP ${response.status}`}: ${error?.message ?? 'Core request failed'}`);
    }
    return response.json;
  }
  async connect(): Promise<{connection:Connection;status:Status}> {
    const connection = await this.load();
    if (!/^http:\/\/127\.0\.0\.1:[1-9][0-9]{0,4}$/.test(connection.base) || new URL(connection.base).port === '' || !/^[a-f0-9]{64}$/.test(connection.token)) throw new Error('Core connection is not a valid authenticated loopback address');
    const status = await this.request(connection,'/v1/status');
    if (!Value.Check(StatusSchema,status) || status.api_version !== '1' || status.status !== 'ready' || pathKey(status.vault_path) !== pathKey(connection.vault)) throw new Error('Core is unavailable or attached to a different Vault');
    return {connection,status};
  }
  async profiles(connection: Connection) {
    const result = await this.request(connection,'/v1/analysis/settings');
    if (!Value.Check(AnalysisSettingsResponseSchema,result)) throw new Error('Core returned invalid Analysis Profile settings');
    return {defaultProfile:result.settings.default_profile,profiles:result.settings.profiles.map(p => ({id:p.id,name:p.name}))};
  }
  async capture(connection: Connection, payload: CaptureRequest): Promise<CaptureResponse> {
    const current = await this.connect();
    if (current.connection.base !== connection.base || pathKey(current.connection.vault) !== pathKey(connection.vault)) throw new Error('Core target changed; the frozen Capture cannot be redirected to another Vault');
    const result = await this.request(current.connection,'/v1/captures',payload);
    if (!Value.Check(CaptureResponseSchema,result) || result.path !== payload.path) throw new Error('Core returned an invalid Capture receipt; retain the same request for inspection');
    return result;
  }
}
