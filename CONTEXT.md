# EngramWeave Zotero Context

This document defines the Zotero Capture adapter. Shared semantics belong in [the system context](../engramweave-docs/CONTEXT.md); installation and verification are described in [README.md](README.md).

## Explicit selected material capture

Users select passages or a group of highlights and comments while reading in Zotero, then explicitly submit the selection to EngramWeave. One operation saves one Source containing selected material, the paper reference, and selected locations. Unselected highlights and paper full text are not automatically submitted.

Comments are retained in Source Annotation. Paper full text may provide reference context for compilation but does not expand selected content scope. Capture saves Source first; scheduling and manual compilation belong to EngramWeave, not this plugin.

Capture offers selection of Review Analyzer and Relation Analyzer template presets configured beforehand in Desktop. Template content, models, and API/Agent routes are not configured during capture. Selection can change while pending; Core uses the final selection and current configuration. The plugin does not implement either analyzer.

## Independence after submission

A submitted Source is independent of later Zotero highlight or comment edits. Its continuing connection to the paper is the original location link, not synchronization. New material is submitted as a new Source. Users may explicitly edit or delete old Sources themselves.

PDF and bibliography remain managed by Zotero. Source does not replace the Zotero paper or create a second bibliography system.

Source Record deletion never authorizes deleting the referenced Zotero paper or PDF. An unarchived Record may have multiple Drafts; only one is selected for final integration, after which all related Drafts are marked discarded. Integrated content may be referenced by multiple formal knowledge files.

## Host and publication boundaries

The first adapter targets Windows Zotero 10.0.x PDF readers. It uses the official text-selection popup and annotation context-menu events, reads only the selected keys from the current attachment, and snapshots text, comments, paper metadata and locations before asynchronous connection work. Reader content callbacks must return before a fresh privileged host task opens Capture or error UI; retaining the selected snapshot does not grant the Reader permission to open chrome windows. Unload cancels pending launches. Comment-only selections are valid; selections without either text or comments are rejected rather than silently omitted. Physical page indices and visible page labels remain distinct. EPUB, OCR, full-PDF extraction and cross-paper submissions are outside this adapter.

One confirmed operation creates one inline `source_type: paper` Markdown Source under `20_Sources/Paper/YYYY-MM/<UUID>.md`, with `processing_status: pending` and `lifecycle_status: active`. Its item locator uses personal or group-library identity; selected locations retain attachment/page/annotation links. Selected comments and optional personal context remain in Annotation. No independent PDF Asset or bibliography database is created.

Core performs protected publication through the existing authenticated loopback Capture API. The adapter reads a bounded external Core configuration and token file, verifies API identity and Vault, and persists only the configuration path. It reads configured Analysis Profile IDs/names; it never configures templates, models or credentials. A saved Source is not yet registered, and Capture does not invoke models. Refresh or a separately authorized Core round performs registration and processing.

The first confirmation freezes path, time, Markdown and Profile. Explicit retry reuses those bytes and the original Core target; delivery uncertainty never authorizes a new identity or silent replay. An edited target conflicts instead of being overwritten. The capture dialog retains unsuccessful input and offers Markdown clipboard export. Closing or restarting Zotero does not promise durable offline recovery. Plugin shutdown unregisters events, menus, localization and preferences and closes its own windows. The package uses manual installation and updates; no hosted automatic update service is provided.
