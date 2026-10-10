# EngramWeave Zotero

- Follow shared product semantics in `../engramweave-docs/CONTEXT.md` and the current P2 scope.
- The plugin captures explicitly selected reading material. Core owns protected Source publication, registration, model work and integration.
- Use official Zotero Reader and plugin APIs. Never query zotero.sqlite directly, enumerate unrelated highlights, or modify papers, attachments or annotations for capture.
- Use English code, comments and identifiers. Maintain Chinese documentation except AGENTS, CONTEXT and ADRs, which use English. Follow `../engramweave/docs/AGENTS.md` for maintained documentation.
- Keep temporary profiles, evidence, packaging output and checkpoint reports under ignored `.local/` or `dist/`.
- Reuse TypeScript, esbuild, Vitest and shared Contracts. No general plugin framework or extra UI framework.
- Keep tests under `tests/` and follow `tests/AGENTS.md`.
- Store only the local Core configuration path and non-sensitive preferences. Core bearer tokens and model credentials must not be persisted in plugin preferences, Source files or diagnostics.
