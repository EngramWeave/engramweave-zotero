# EngramWeave Zotero Context

This document defines intended behavior for the planned Zotero plugin; it does not claim an implemented plugin. Shared semantics belong in [the system context](../engramweave-docs/CONTEXT.md).

## Explicit selected material capture

Users select passages or a group of highlights and comments while reading in Zotero, then explicitly submit the selection to EngramWeave. One operation saves one Source containing selected material, the paper reference, and selected locations. Unselected highlights and paper full text are not automatically submitted.

Comments are retained in Source Annotation. Paper full text may provide reference context for compilation but does not expand selected content scope. Capture saves Source first; scheduling and manual compilation belong to EngramWeave, not this plugin.

Capture offers selection of Review Analyzer and Relation Analyzer template presets configured beforehand in Desktop. Template content, models, and API/Agent routes are not configured during capture. Selection can change while pending; Core uses the final selection and current configuration. The plugin does not implement either analyzer.

## Independence after submission

A submitted Source is independent of later Zotero highlight or comment edits. Its continuing connection to the paper is the original location link, not synchronization. New material is submitted as a new Source. Users may explicitly edit or delete old Sources themselves.

PDF and bibliography remain managed by Zotero. Source does not replace the Zotero paper or create a second bibliography system.

Source Record deletion never authorizes deleting the referenced Zotero paper or PDF. An unarchived Record may have multiple Drafts; only one is selected for final integration, after which all related Drafts are marked discarded. Integrated content may be referenced by multiple formal knowledge files.
