# Tests

- Protect selected-material boundaries, exact serialization, URI identity, connection authentication and frozen retry behavior using Vitest.
- Keep test mocks and fixtures under tests. Distinguish simulated adapter checks, native Zotero interaction and actual model execution.
- Use few cross-component tests and a short native manual checklist; do not mechanically duplicate DOM code.
- Native tests use isolated Zotero profiles and Vaults, never the user's active library.
- Put raw evidence and checkpoint reports under ignored `.local/`; maintained documentation describes reproducible checks.
