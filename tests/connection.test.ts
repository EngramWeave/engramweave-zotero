import {it,expect} from 'vitest';
import {CoreClient,type Transport} from '../src/core-client.js';
import {LIMITS} from '@engramweave/contracts';
it('rejects a changed Vault or unauthenticated endpoint without posting, and never silently retries',async()=>{
  const first={base:'http://127.0.0.1:3210',vault:'D:/Vault',token:'a'.repeat(64)};let current={...first};const calls:string[]=[];
  const status={status:'ready',core_version:'0.1.0',api_version:'1',instance_id:'fixture',vault_path:first.vault,data_dir:'D:/Data',database_initialized:true,index_generation:0,last_scan_at:null,counts:{sources:0,knowledge:0,invalid:0,missing:0,unsupported:0},active_job:null,scan_roots:[],limits:LIMITS,diagnostics:[]};
  const transport:Transport=async(url,method)=>{calls.push(`${method} ${url}`);if(method==='POST')throw new Error('lost');return {status:200,json:status};};
  const client=new CoreClient(transport,async()=>current);expect((await client.connect()).connection.vault).toBe(first.vault);
  current={...first,vault:'D:/Other'};await expect(client.capture(first,{path:'20_Sources/a.md',markdown:'raw'})).rejects.toThrow('different Vault');expect(calls.some(x=>x.startsWith('POST'))).toBe(false);
  current={...first};await expect(client.capture(first,{path:'20_Sources/a.md',markdown:'raw'})).rejects.toThrow('may be unknown');expect(calls.filter(x=>x.startsWith('POST'))).toHaveLength(1);
  current={...first,base:'https://example.com'};await expect(client.connect()).rejects.toThrow('loopback');
});
