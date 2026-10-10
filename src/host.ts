import type { Connection, Transport } from './core-client.js';
declare const Zotero: any;
declare const IOUtils: { stat(path:string):Promise<{type:string;size:number}>; readUTF8(path:string):Promise<string> };
declare const PathUtils: {join(...parts:string[]):string;parent(path:string):string};
declare const Services: any;
declare const Components:any;

export const preference = 'extensions.engramweave.coreConfig';
function key(path:string) {return path.replaceAll('\\','/').replace(/\/$/,'').toLowerCase();}
async function regularRead(filename:string,limit:number,label:string):Promise<string> {
  const unreadable=()=>new Error(`${label} file cannot be read: ${filename}. Check the Core configuration path in EngramWeave connection settings.`);
  let file;try{file=Zotero.File.pathToFile(filename);file.normalize();}catch{throw unreadable();}
  if (!file.isAbsolute?.() && !/^(?:[A-Za-z]:[\\/]|\\\\)/.test(filename)) throw new Error('Select an absolute Core configuration path');
  for (let current = file;current;current = current.parent) if (current.isSymlink()) throw new Error('Core configuration must not use linked paths');
  let info;try{info=await IOUtils.stat(file.path);}catch{throw unreadable();}
  if (info.type !== 'regular' || info.size > limit) throw new Error('Core configuration file is not a bounded regular file');
  let text;try{text=await IOUtils.readUTF8(file.path);}catch{throw unreadable();}
  if (new TextEncoder().encode(text).length > limit) throw new Error('Core configuration file is too large');
  return text;
}
export async function loadConnection(configPath:string):Promise<Connection> {
  const text=await regularRead(configPath,16384,'Core configuration');
  let config;try{config=JSON.parse(text);}catch{throw new Error(`Core configuration JSON is invalid: ${configPath}`);}
  if(config.config_version!==1 || config.host!=='127.0.0.1' || !Number.isInteger(config.port) || config.port<1 || config.port>65535
    || typeof config.vault_path!=='string' || typeof config.data_dir!=='string' || !/^[A-Za-z]:[\\/]/.test(config.vault_path) || !/^[A-Za-z]:[\\/]/.test(config.data_dir)) throw new Error('Core configuration is invalid');
  const vaultFile = Zotero.File.pathToFile(config.vault_path);vaultFile.normalize();const dataFile = Zotero.File.pathToFile(config.data_dir);dataFile.normalize();
  if(!vaultFile.isDirectory() || !dataFile.isDirectory() || dataFile.isSymlink() || vaultFile.isSymlink() || key(dataFile.path)===key(vaultFile.path) || key(dataFile.path).startsWith(key(vaultFile.path)+'/')) throw new Error('Core runtime data must be a real directory outside the Vault');
  const token=await regularRead(PathUtils.join(dataFile.path,'token'),1024,'Core token');
  return {base:`http://127.0.0.1:${config.port}`,vault:vaultFile.path,token};
}
export const transport:Transport = async(url,method,token,body) => {
  const response=await Zotero.HTTP.request(method,url,{headers:{Authorization:`Bearer ${token}`,...body ? {'Content-Type':'application/json'} : {}},body,
    responseType:'json',successCodes:false,timeout:15000,followRedirects:false,foreground:false,anon:true,errorDelayMax:0,noRetryOnThrottle:true,logBodyLength:0,debug:false});
  return {status:response.status,json:response.response};
};
export function getConfigPath() {return Zotero.Prefs.get(preference,true) || PathUtils.join(Services.env.get('LOCALAPPDATA'),'EngramWeave','p1','config.json');}
export function setConfigPath(path:string) {Zotero.Prefs.set(preference,path,true);}
export function notify(message:string) {const progress=new Zotero.ProgressWindow();progress.changeHeadline('EngramWeave');progress.addDescription(message);progress.show();progress.startCloseTimer(6000);}
export const host = {Zotero,Services};
export function registerChrome(rootURI:string):{destruct():void} {
  const startup=Components.classes['@mozilla.org/addons/addon-manager-startup;1'].getService(Components.interfaces.amIAddonManagerStartup);
  return startup.registerChrome(Services.io.newURI(rootURI+'manifest.json'),[['content','engramweave','./']]);
}
