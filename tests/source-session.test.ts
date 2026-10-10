import { describe,expect,it } from 'vitest';
import { parse } from 'yaml';
import { createSource } from '../src/source.js';
import { CaptureSession } from '../src/capture-session.js';
import { readerSelection, type ReaderData, type ZoteroItem } from '../src/reader-capture.js';
import { itemLocator,passageLocator,type Selection } from '../src/selection.js';

const uuid='00000000-0000-4000-8000-000000000001',instant='2026-10-10T01:02:03.000Z';
export const selection=():Selection=>({paper:{library:'library',itemKey:'PAPER123',attachmentKey:'PDF12345',title:'Paper "title"',author:['A'],date:'2026',doi:''},
  passages:[{key:'ANNO1234',type:'highlight',text:'condition A\n中文 "quote" : ---',comment:'我的理解\n<b>not executed</b>',pageLabel:'iv',pageIndex:3,sortIndex:'00003',tags:['scope']}]});
describe('selected Source and frozen retry',()=>{
  it('retains exact selected text/comments and real physical positions while producing one paper Source',()=>{
    const s=selection();const result=createSource(s,{title:s.paper.title,annotation:'额外上下文',profile:'academic'},uuid,instant);
    const header=/^---\n([\s\S]+?)\n---\n/.exec(result.markdown)!;const metadata=parse(header[1]);
    expect(result.path).toBe(`20_Sources/Paper/2026-10/${uuid}.md`);expect(metadata).toMatchObject({source_type:'paper',processing_status:'pending',lifecycle_status:'active',analysis_profile:'academic',captured_at:instant});
    expect(metadata.annotation).toContain(s.passages[0].comment);expect(metadata.annotation).toContain('额外上下文');
    expect(result.markdown.slice(header[0].length)).toContain(s.passages[0].text);expect(result.markdown.slice(header[0].length)).not.toContain(s.passages[0].comment);
    expect(passageLocator(s.paper,s.passages[0])).toContain('page=4&annotation=ANNO1234');expect(itemLocator({...s.paper,library:'groups/42'})).toBe('zotero://select/groups/42/items/PAPER123');
    s.passages[0].key=null;expect(passageLocator(s.paper,s.passages[0])).not.toContain('annotation=');
    s.passages[0].text='';expect(createSource(s,{title:'Comments',annotation:''},uuid,instant).markdown.endsWith('---\n')).toBe(true);
    s.passages[0].comment='';expect(()=>createSource(s,{title:'Empty',annotation:''},uuid,instant)).toThrow('contains no text');
  });
  it('reads only selected keys and rejects wrong attachments without reading all annotations',()=>{
    const base={id:2,key:'PDF12345',libraryID:1,parentID:1,attachmentReaderType:'pdf',isAttachment:()=>true,isAnnotation:()=>false,getField:()=> 'Paper',getCreators:()=>[],getTags:()=>[]};
    const parent={...base,id:1,key:'PAPER123',parentID:null,isAttachment:()=>false};
    const annotation={...base,id:3,key:'ANNO1234',parentID:2,isAttachment:()=>false,isAnnotation:()=>true,annotationType:'highlight',annotationText:'Selected',annotationComment:'Context',annotationPageLabel:'iv',annotationPosition:'{"pageIndex":3}'};
    const calls:string[]=[];const data:ReaderData={item:id=>[parent,base].find(x=>x.id===id) as ZoteroItem,library:()=>({type:'user'}),annotation:(_id,key)=>{calls.push(key);return key==='ANNO1234'?annotation:undefined;}};
    expect(readerSelection(data,{itemID:2,type:'pdf'},['ANNO1234']).passages[0].text).toBe('Selected');expect(calls).toEqual(['ANNO1234']);
    annotation.parentID=9;expect(()=>readerSelection(data,{itemID:2,type:'pdf'},['ANNO1234'])).toThrow('another attachment');
    annotation.parentID=2;
    for(const type of ['note','text','image','ink']){annotation.annotationType=type;const selected=readerSelection(data,{itemID:2,type:'pdf'},['ANNO1234']);expect(selected.passages[0].text).toBe('');expect(selected.passages[0].comment).toBe('Context');}
    annotation.annotationComment='';expect(()=>readerSelection(data,{itemID:2,type:'pdf'},['ANNO1234'])).toThrow('Selected ink annotation ANNO1234 contains no text or comment');
    expect(()=>readerSelection(data,{itemID:2,type:'epub'},['ANNO1234'])).toThrow('PDF');
    const temporary=readerSelection(data,{itemID:2,type:'pdf'},undefined,{text:'Unsaved selection',position:{pageIndex:1},pageLabel:'ii'});expect(temporary.passages[0].key).toBeNull();
  });
  it('keeps identity, time and payload on unknown delivery, then consumes the same receipt without duplicate posting',async()=>{
    const requests:unknown[]=[];let failing=true;
    const client={async capture(_connection:unknown,payload:any){requests.push({...payload});if(failing)throw new Error('Response lost');return {path:payload.path,revision:'a'.repeat(64),created:false,scan_required:true as const};}};
    const s=selection();const session=new CaptureSession(s,{base:'http://127.0.0.1:1',vault:'D:/fixture',token:'a'.repeat(64)},client,()=>uuid,()=>instant);
    await expect(session.submit({title:'Title',annotation:'Context'})).rejects.toThrow('Response lost');s.passages[0].text='Later edit';failing=false;
    await session.submit({title:'Changed title',annotation:'Changed context'});expect(requests[1]).toEqual(requests[0]);expect(session.payload!.markdown).not.toContain('Later edit');
    await session.submit({title:'Other',annotation:''});expect(requests).toHaveLength(2);
    const again=new CaptureSession(selection(),session.connection,client,()=>uuid.replace(/1$/,'2'),()=>instant);await again.submit({title:'Title',annotation:'Context'});expect(again.payload!.path).not.toBe(session.payload!.path);
  });
});
