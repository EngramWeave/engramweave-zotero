import { stringify } from 'yaml';
import { Value } from '@sinclair/typebox/value';
import { AnalysisProfileIdSchema, CaptureRequestSchema, LIMITS, type CaptureRequest } from '@engramweave/contracts';
import { validateSelection, itemLocator, passageLocator, type Selection } from './selection.js';

export interface CaptureOptions { title: string; annotation: string; profile?: string }
export function createSource(selection: Selection, options: CaptureOptions, uuid: string, capturedAt: string): CaptureRequest {
  selection = validateSelection(selection);
  if (!/^[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}$/.test(uuid) || !/^\d{4}-\d{2}-\d{2}T/.test(capturedAt) || !Number.isFinite(Date.parse(capturedAt))) throw new Error('Capture identity or time is invalid');
  if (!options.title.trim() || options.title.length > 500 || options.annotation.length > 64000) throw new Error('Capture needs a title and bounded Annotation');
  if (options.profile && !Value.Check(AnalysisProfileIdSchema,options.profile)) throw new Error('Select a valid Analysis Profile');
  const { paper, passages } = selection;
  const comments = passages.filter(p => p.comment.length).map(p => `[${p.pageLabel || 'PDF'}] ${passageLocator(paper,p)}\n${p.comment}`);
  if (options.annotation.length) comments.push(options.annotation);
  const properties = { type: 'raw_source', source_type: 'paper', title: options.title, source: itemLocator(paper), captured_at: capturedAt,
    processing_status: 'pending', lifecycle_status: 'active', annotation: comments.join('\n\n'),
    ...(options.profile ? { analysis_profile: options.profile } : {}), author: paper.author,
    paper_date: paper.date, doi: paper.doi, tags: [...new Set(passages.flatMap(p => p.tags))],
    zotero: { library: paper.library, item_key: paper.itemKey, attachment_key: paper.attachmentKey,
      locations: passages.map(p => ({ annotation_key:p.key,page_label:p.pageLabel,page_index:p.pageIndex,locator:passageLocator(paper,p),type:p.type })) } };
  const body = passages.filter(p => p.text.length).map(p => `### [${p.pageLabel || 'PDF'}](${passageLocator(paper,p)})\n\n${p.text}`).join('\n\n');
  const markdown = `---\n${stringify(properties,{lineWidth:0})}---\n${body}`;
  const result = { path:`20_Sources/Paper/${capturedAt.slice(0,7)}/${uuid}.md`, markdown };
  if (!Value.Check(CaptureRequestSchema,result) || new TextEncoder().encode(markdown).length > LIMITS.markdown_bytes) throw new Error('Capture exceeds the Source byte limit; no selected content was truncated');
  return result;
}
