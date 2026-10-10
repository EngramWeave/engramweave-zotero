import { CoreClient } from './core-client.js';
import { getConfigPath,setConfigPath,loadConnection,transport,notify,host,registerChrome } from './host.js';
import { readerSelection, type Reader, type ReaderData } from './reader-capture.js';
import { mountCapture } from './capture-dialog.js';
import { errorMessage } from './errors.js';
import { CaptureLauncher } from './capture-launcher.js';
const {Zotero}=host;
interface Event {reader:Reader;doc:Document;params:{ids?:string[];annotation?:Record<string,unknown>};append:(item:unknown)=>void}

export function createRuntime(data:{id:string;rootURI:string}) {
  const windows=new Set<Window>();let menuID:string|undefined,paneID:string|undefined,chrome:{destruct():void}|undefined;
  const adapter:ReaderData={item:id=>Zotero.Items.get(id),annotation:(libraryID,key)=>Zotero.Items.getByLibraryAndKey(libraryID,key),library:id=>{const library=Zotero.Libraries.get(id);return {type:library.libraryType,groupID:library.libraryType==='group'?Zotero.Groups.getGroupIDFromLibraryID(id):undefined};}};
  const dialog=(name:string,mount:(window:Window)=>void)=>{const parent=Zotero.getMainWindow();if(!parent)throw new Error('Open the Zotero library window before capture');const win=parent.openDialog('chrome://engramweave/content/'+name,'', 'chrome,centerscreen,resizable,dialog=no');windows.add(win);win.addEventListener('unload',()=>windows.delete(win),{once:true});win.addEventListener('load',()=>mount(win),{once:true});return win;};
  const launcher=new CaptureLauncher(selection=>{const client=new CoreClient(transport,()=>loadConnection(getConfigPath()));dialog('capture.xhtml',win=>mountCapture(win,selection,client));},notify);
  const capture=(event:Event,keys?:string[],temporary?:Record<string,unknown>)=>launcher.capture(()=>readerSelection(adapter,{itemID:event.reader.itemID,type:event.reader.type},keys,temporary));
  const selectionHandler=(event:Event)=>{if(event.reader.type!=='pdf')return;const button=event.doc.createElement('button');button.textContent='Capture to EngramWeave';button.addEventListener('click',()=>capture(event,undefined,event.params.annotation));event.append(button);};
  const annotationHandler=(event:Event)=>{if(event.reader.type!=='pdf')return;const keys=event.params.ids===undefined?undefined:Array.from(event.params.ids);event.append({label:'Capture to EngramWeave',onCommand:()=>capture(event,keys)});};
  const preferences=()=>dialog('preferences.xhtml',win=>{const doc=win.document,input=doc.getElementById('config-path') as HTMLInputElement,result=doc.getElementById('result')!;input.value=getConfigPath();
    doc.getElementById('test')!.addEventListener('click',()=>{void(async()=>{const button=doc.getElementById('test') as HTMLButtonElement;button.disabled=true;try{input.value=input.value.trim();setConfigPath(input.value);const client=new CoreClient(transport,()=>loadConnection(getConfigPath()));const {connection}=await client.connect();const settings=await client.profiles(connection);result.textContent=`Connected · ${connection.vault}\n${settings.profiles.length} Analysis Profiles`; }catch(e){result.textContent=errorMessage(e,'Connection failed');}finally{button.disabled=false;}})();});doc.getElementById('close')!.addEventListener('click',()=>win.close());});
  const loadWindow=(window:any)=>window.MozXULElement.insertFTLIfNeeded('engramweave.ftl');
  const unloadWindow=(window:any)=>window.document.querySelector('[href="engramweave.ftl"]')?.remove();
  return {loadWindow,unloadWindow,async start(){await Zotero.uiReadyPromise;chrome=registerChrome(data.rootURI);for(const window of Zotero.getMainWindows())loadWindow(window);Zotero.Reader.registerEventListener('renderTextSelectionPopup',selectionHandler,data.id);Zotero.Reader.registerEventListener('createAnnotationContextMenu',annotationHandler,data.id);
    Zotero.EngramWeave={openPreferences:preferences};paneID=await Zotero.PreferencePanes.register({pluginID:data.id,src:'prefs-pane.xhtml',label:'EngramWeave',scripts:['prefs-pane.js'],stylesheets:[]});
    menuID=Zotero.MenuManager.registerMenu({menuID:'engramweave-connection',pluginID:data.id,target:'main/menubar/tools',menus:[{menuType:'menuitem',l10nID:'engramweave-connection',onCommand:preferences}]});
  },async stop(){launcher.stop();Zotero.Reader.unregisterEventListener('renderTextSelectionPopup',selectionHandler);Zotero.Reader.unregisterEventListener('createAnnotationContextMenu',annotationHandler);if(menuID)Zotero.MenuManager.unregisterMenu(menuID);if(paneID)Zotero.PreferencePanes.unregister(paneID);delete Zotero.EngramWeave;for(const window of Zotero.getMainWindows())unloadWindow(window);for(const win of windows)if(!win.closed)win.close();windows.clear();chrome?.destruct();}};
}
