import {it,expect,vi} from 'vitest';
it('reads only bounded local configuration and token files, refusing remote or linked configuration',async()=>{
  const configPath='D:\\AppData\\config.json',data='D:\\AppData',vault='D:\\Vault';
  let config={config_version:1,host:'127.0.0.1',port:43127,vault_path:vault,data_dir:data};let linked=false;let size=128;let missing=false;
  const reads:string[]=[];
  vi.stubGlobal('Zotero',{File:{pathToFile:(filename:string)=>({path:filename,normalize(){},isSymlink:()=>linked,isDirectory:()=>true,parent:null})}});
  vi.stubGlobal('IOUtils',{stat:async()=>{if(missing)throw {message:'Native file exception'};return {type:'regular',size};},readUTF8:async(filename:string)=>{reads.push(filename);return filename===configPath?JSON.stringify(config):'a'.repeat(64);}});
  vi.stubGlobal('PathUtils',{join:(...parts:string[])=>parts.join('\\')});vi.stubGlobal('Services',{});
  try{const {loadConnection}=await import('../src/host.js');
    expect(await loadConnection(configPath)).toEqual({base:'http://127.0.0.1:43127',vault,token:'a'.repeat(64)});expect(reads).toEqual([configPath,data+'\\token']);
    reads.length=0;config={...config,host:'example.com'};await expect(loadConnection(configPath)).rejects.toThrow('invalid');expect(reads).toEqual([configPath]);
    linked=true;reads.length=0;await expect(loadConnection(configPath)).rejects.toThrow('linked');expect(reads).toEqual([]);
    linked=false;size=16385;await expect(loadConnection(configPath)).rejects.toThrow('bounded');expect(reads).toEqual([]);
    missing=true;await expect(loadConnection(configPath)).rejects.toThrow(`Core configuration file cannot be read: ${configPath}`);expect(reads).toEqual([]);
  }finally{vi.unstubAllGlobals();}
});
