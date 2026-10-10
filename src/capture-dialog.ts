import { CoreClient, type Connection } from './core-client.js';
import { createSource, type CaptureOptions } from './source.js';
import { CaptureSession } from './capture-session.js';
import { passageLocator, type Selection } from './selection.js';
import { host } from './host.js';
import type { CaptureRequest } from '@engramweave/contracts';
import { errorMessage } from './errors.js';
const html = 'http://www.w3.org/1999/xhtml';

export function mountCapture(win: Window, selection: Selection, client: CoreClient) {
  const doc=win.document;const element=<T extends HTMLElement>(id:string)=>doc.getElementById(id) as T;
  const title=element<HTMLInputElement>('capture-title'),annotation=element<HTMLTextAreaElement>('annotation'),profile=element<HTMLSelectElement>('profile');
  const save=element<HTMLButtonElement>('save'),copy=element<HTMLButtonElement>('copy'),connect=element<HTMLButtonElement>('connect'),open=element<HTMLButtonElement>('open');
  const error=element('capture-error'),feedback=element('capture-feedback'),destination=element('destination');title.value=selection.paper.title;
  let connection:Connection|null=null,session:CaptureSession|null=null,frozen:CaptureRequest|null=null,connecting=false;
  const options=():CaptureOptions=>({title:title.value,annotation:annotation.value,...profile.value?{profile:profile.value}:{}});
  const lock=()=>{for(const field of [title,annotation,profile])field.disabled=Boolean(frozen);};
  const freeze=()=>{frozen??=createSource(selection,options(),crypto.randomUUID(),new Date().toISOString());lock();return frozen;};
  for(const passage of selection.passages){const block=doc.createElementNS(html,'div');block.className='passage';
    const location=doc.createElementNS(html,'a') as HTMLAnchorElement;location.textContent=`${passage.pageLabel || 'PDF'}${passage.key ? ' · Annotation' : ''}`;location.href=passageLocator(selection.paper,passage);location.addEventListener('click',event=>{event.preventDefault();host.Zotero.getMainWindow().ZoteroPane.loadURI(location.href);});block.append(location);
    for(const [text,cls] of [[passage.text,'excerpt'],[passage.comment,'comment']])if(text){const p=doc.createElementNS(html,'p');p.className=cls;p.textContent=text;block.append(p);}element('selection').append(block);
  }
  const refreshConnection=async()=>{
    if(connecting || session?.busy)return;connecting=true;connect.disabled=true;save.disabled=true;error.textContent='';
    try{const result=await client.connect();const settings=await client.profiles(result.connection);if(win.closed)return;
      if(connection && (result.connection.base!==connection.base || result.connection.vault.toLowerCase()!==connection.vault.toLowerCase()) && frozen)throw new Error('Core target changed. Inspect the frozen Capture; it cannot be redirected.');
      connection=result.connection;destination.textContent=`Vault · ${connection.vault}\n${connection.base}`;
      const selectedProfile=profile.value;profile.replaceChildren();const fallback=doc.createElementNS(html,'option') as HTMLOptionElement;fallback.value='';fallback.textContent=settings.defaultProfile?`Desktop default · ${settings.defaultProfile}`:'Desktop default (not configured)';profile.append(fallback);
      for(const p of settings.profiles){const option=doc.createElementNS(html,'option') as HTMLOptionElement;option.value=p.id;option.textContent=p.name;profile.append(option);}if(selectedProfile && !settings.profiles.some(p=>p.id===selectedProfile)){const missing=doc.createElementNS(html,'option') as HTMLOptionElement;missing.value=selectedProfile;missing.textContent=`${selectedProfile} (unavailable)`;profile.append(missing);}profile.value=selectedProfile;
      save.disabled=false;connect.hidden=true;
    }catch(e){error.textContent=errorMessage(e,'Core connection failed');destination.textContent='Not connected · check EngramWeave connection settings';connect.hidden=false;}
    finally{connecting=false;connect.disabled=false;lock();}
  };
  connect.addEventListener('click',()=>{void refreshConnection();});
  save.addEventListener('click',()=>{void(async()=>{if(!connection || session?.busy)return;error.textContent='';save.disabled=true;copy.disabled=true;connect.disabled=true;
    try{const payload=freeze();session??=new CaptureSession(selection,connection!,client);session.payload=payload;const receipt=await session.submit(options());if(win.closed)return;
      feedback.textContent=`Saved · ${receipt.path}\nSource is pending; registry updates on Refresh workspace or a Core processing round.`;annotation.value='';save.hidden=true;copy.hidden=true;connect.hidden=true;open.hidden=false;
    }catch(e){if(!win.closed){error.textContent=errorMessage(e,'Capture failed');save.textContent=frozen?'Retry same Source':'Save Source';save.disabled=false;copy.disabled=false;connect.disabled=false;}}
  })();});
  copy.addEventListener('click',()=>{try{const payload=freeze();host.Zotero.Utilities.Internal.copyTextToClipboard(payload.markdown);feedback.textContent=`Copied · ${payload.path}\nThis exports Markdown; it does not confirm delivery. Keep the same frozen Source for retry.`;}catch(e){error.textContent=errorMessage(e,'Export failed');}});
  open.addEventListener('click',()=>{if(!connection || !session?.receipt)return;const name=connection.vault.replaceAll('\\','/').split('/').filter(Boolean).at(-1)!;const uri=`obsidian://open?vault=${encodeURIComponent(name)}&file=${encodeURIComponent(session.receipt.path)}`;host.Zotero.getMainWindow().ZoteroPane.loadURI(uri);});
  let closing=false;
  const close=()=>{if(session?.busy){error.textContent='Saving is in progress. Keep this window open until the result is known.';return;}if(frozen && !session?.receipt && !host.Services.prompt.confirm(win,'EngramWeave','This Capture has no confirmed receipt. Closing loses the frozen retry request. Copy Source Markdown before closing if delivery may be unknown. Close anyway?'))return;closing=true;win.close();};
  element('close').addEventListener('click',close);
  win.addEventListener('close',event=>{if(closing)return;if(session?.busy){event.preventDefault();error.textContent='Saving is in progress. Keep this window open until the result is known.';}else if(frozen && !session?.receipt && !host.Services.prompt.confirm(win,'EngramWeave','This Capture has no confirmed receipt. Closing loses the frozen retry request. Copy Source Markdown before closing if delivery may be unknown. Close anyway?'))event.preventDefault();});void refreshConnection();
}
