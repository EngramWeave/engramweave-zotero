# EngramWeave Zotero Context

This document defines intended behavior for the planned Zotero plugin; it does not claim an implemented plugin. Shared semantics belong in [the system context](../doc/CONTEXT.md).

## Explicit selected material capture

Users select passages or a group of highlights and comments while reading in Zotero, then explicitly submit the selection to EngramWeave. One operation saves one Source containing selected material, the paper reference, and selected locations. Unselected highlights and paper full text are not automatically submitted.

Comments are retained in Source Annotation. Paper full text may provide reference context for compilation but does not expand selected content scope. Capture saves Source first; scheduling and manual compilation belong to EngramWeave, not this plugin.

Capture can offer convenient selection of analysis template presets. Analysis Profile composition, models, and API/Agent execution are owned by Core; the plugin records the user's selection without implementing Review or Relation analysis itself. How selections bind to later profile changes is part of the shared contract, not a plugin-specific default.

## Independence after submission

A submitted Source is independent of later Zotero highlight or comment edits. Its continuing connection to the paper is the original location link, not synchronization. New material is submitted as a new Source. Users may explicitly edit or delete old Sources themselves.

PDF and bibliography remain managed by Zotero. Source does not replace the Zotero paper or create a second bibliography system.
