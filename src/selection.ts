export interface Paper {
  library: 'library' | `groups/${number}`;
  itemKey: string; attachmentKey: string; title: string;
  author: string[]; date: string; doi: string;
}
export interface SelectedPassage {
  key: string | null; type: string; text: string; comment: string;
  pageLabel: string; pageIndex: number | null; sortIndex: string; tags: string[];
}
export interface Selection { paper: Paper; passages: SelectedPassage[] }
const keyPattern = /^[A-Z0-9]{8}$/;
export function validateSelection(selection: Selection): Selection {
  const { paper, passages } = selection;
  if (!/^(library|groups\/[1-9][0-9]*)$/.test(paper.library) || !keyPattern.test(paper.itemKey) || !keyPattern.test(paper.attachmentKey)) throw new Error('Zotero paper or attachment identity is invalid');
  if (!passages.length || passages.length > 100) throw new Error('Select 1–100 passages or annotations from one PDF');
  for (const passage of passages) {
    if (passage.key !== null && !keyPattern.test(passage.key)) throw new Error('Selected annotation identity is invalid');
    if (!passage.text.trim() && !passage.comment.trim()) throw new Error(`Selected ${passage.type} annotation ${passage.key ?? ''} contains no text or comment; explicitly remove it from the selection before capture`);
    if (passage.pageIndex !== null && (!Number.isSafeInteger(passage.pageIndex) || passage.pageIndex < 0)) throw new Error('Selected PDF page index is invalid');
  }
  const copied: Selection = JSON.parse(JSON.stringify(selection));
  copied.passages.sort((a,b) => (a.pageIndex ?? Infinity) - (b.pageIndex ?? Infinity) || a.sortIndex.localeCompare(b.sortIndex));
  return copied;
}
export function itemLocator(paper: Paper) { return `zotero://select/${paper.library}/items/${paper.itemKey}`; }
export function passageLocator(paper: Paper, passage: SelectedPassage) {
  const uri = `zotero://open-pdf/${paper.library}/items/${paper.attachmentKey}`;
  const params = new URLSearchParams();
  if (passage.pageIndex !== null) params.set('page', String(passage.pageIndex + 1));
  if (passage.key) params.set('annotation', passage.key);
  return uri + (params.size ? `?${params}` : '');
}
