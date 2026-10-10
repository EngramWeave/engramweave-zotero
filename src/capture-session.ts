import type { CaptureRequest, CaptureResponse } from '@engramweave/contracts';
import { createSource, type CaptureOptions } from './source.js';
import type { Selection } from './selection.js';
import type { Connection, CoreClient } from './core-client.js';

export class CaptureSession {
  payload: CaptureRequest | null = null;
  receipt: CaptureResponse | null = null;
  busy = false;
  readonly selection: Selection;
  constructor(selection: Selection, readonly connection: Connection, private readonly client: Pick<CoreClient,'capture'>,
    private readonly uuid: () => string = () => crypto.randomUUID(), private readonly now = () => new Date().toISOString()) { this.selection = JSON.parse(JSON.stringify(selection)); }
  freeze(options: CaptureOptions) { this.payload ??= createSource(this.selection,options,this.uuid(),this.now()); return this.payload; }
  async submit(options: CaptureOptions) {
    if (this.busy) throw new Error('Capture is already being submitted');
    if (this.receipt) return this.receipt;
    const payload = this.freeze(options); this.busy = true;
    try { this.receipt = await this.client.capture(this.connection,payload); return this.receipt; }
    finally { this.busy = false; }
  }
}
