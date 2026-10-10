import { validateSelection, type Selection, type Paper, type SelectedPassage } from './selection.js';

export interface ZoteroItem {
  id:number;key:string;libraryID:number;parentID:number|null;attachmentReaderType?:string;
  annotationType?:string;annotationText?:string;annotationComment?:string;annotationPageLabel?:string;annotationPosition?:string;annotationSortIndex?:string;
  isAnnotation():boolean;isAttachment():boolean;getField(name:string):string;getCreators():{firstName?:string;lastName?:string;name?:string}[];getTags():{tag:string}[];
}
export interface Reader { itemID:number;type:string;_iframeWindow?:Window }
export interface ReaderData {
  item(id:number): ZoteroItem | undefined;
  annotation(libraryID:number,key:string): ZoteroItem | undefined;
  library(id:number): {type:string;groupID?:number};
}
export function readerSelection(data: ReaderData, reader: Reader, keys?: string[], temporary?: Record<string,unknown>): Selection {
  if (reader.type !== 'pdf') throw new Error('E1 captures PDF text and comments only');
  const attachment = data.item(reader.itemID);
  if (!attachment?.isAttachment() || attachment.attachmentReaderType !== 'pdf') throw new Error('Current PDF attachment is unavailable');
  const parent = attachment.parentID ? data.item(attachment.parentID) : undefined;
  if (attachment.parentID && !parent) throw new Error('The paper was removed; select current material again');
  const library = data.library(attachment.libraryID);
  if (library.type !== 'user' && library.type !== 'group') throw new Error('This Zotero library is not supported for capture');
  if (library.type === 'group' && (!Number.isSafeInteger(library.groupID) || library.groupID! < 1)) throw new Error('Zotero group identity is unavailable');
  const item = parent ?? attachment;
  const paper: Paper = {library:library.type === 'group' ? `groups/${library.groupID!}` : 'library',itemKey:item.key,attachmentKey:attachment.key,
    title:item.getField('title') || attachment.getField('title') || 'Untitled paper',
    author:parent ? parent.getCreators().map(c => c.name ?? [c.firstName,c.lastName].filter(Boolean).join(' ')) : [],date:parent?.getField('date') ?? '',doi:parent?.getField('DOI') ?? ''};
  let passages: SelectedPassage[];
  if (keys) {
    if (!keys.length || keys.length > 100 || new Set(keys).size !== keys.length) throw new Error('Select 1–100 unique annotations');
    passages = keys.map(key => {
      if (!/^[A-Z0-9]{8}$/.test(key)) throw new Error('Invalid selected annotation key');
      const annotation = data.annotation(attachment.libraryID,key);
      if (!annotation?.isAnnotation() || annotation.parentID !== attachment.id || annotation.libraryID !== attachment.libraryID) throw new Error('Selected annotation belongs to another attachment or is unavailable');
      let position: {pageIndex?:unknown};try{position=JSON.parse(annotation.annotationPosition ?? '{}');}catch{throw new Error('Selected annotation position is invalid');}
      const type=annotation.annotationType ?? 'note';
      return {key,type,text:['highlight','underline'].includes(type) ? annotation.annotationText ?? '' : '',comment:annotation.annotationComment ?? '',
        pageLabel:annotation.annotationPageLabel ?? '',pageIndex:typeof position.pageIndex === 'number' ? position.pageIndex : null,sortIndex:annotation.annotationSortIndex ?? '',tags:annotation.getTags().map(t => t.tag)};
    });
  } else {
    if (!temporary || typeof temporary.text !== 'string' || !temporary.text.trim()) throw new Error('Select PDF text before capture');
    const position = temporary.position as {pageIndex?:unknown} | undefined;
    passages = [{key:null,type:'selection',text:temporary.text,comment:'',pageLabel:typeof temporary.pageLabel === 'string' ? temporary.pageLabel : '',
      pageIndex:typeof position?.pageIndex === 'number' ? position.pageIndex : null,sortIndex:'',tags:[]}];
  }
  return validateSelection({paper,passages});
}
