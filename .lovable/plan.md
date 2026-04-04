
## File-Based Run Ingestion System

Since this is a client-side app, we can't read from the filesystem directly. Here's the approach:

### Folder Structure (documented for users)
```
test-results/
├── run-2026-04-01/
│   └── results.json          # single file per run
├── run-2026-04-02/
│   ├── auth.json              # or split by suite
│   ├── checkout.json
│   └── manifest.json
├── full-report.json           # or flat single file with all runs
└── another-run.json           # individual run files at root
```

### Implementation
1. **Define JSON schema** — `src/models/schemas.ts` with clear types for the expected JSON format (single run, multi-run, and per-suite splits)
2. **File upload system** — `src/services/fileIngestion.ts` that parses uploaded JSON files/folders, validates schema, merges suite-level files into runs
3. **Upload UI** — Drag-and-drop zone on dashboard + a dedicated import page, supporting single files, multiple files, and folder uploads
4. **RunsContext update** — Support both mock/demo mode and real imported data, persist imported runs in localStorage
5. **Help page update** — Document the exact JSON schema, folder structure, and integration examples (e.g., Playwright JSON reporter config)

### Supported formats
- **Single run file**: `{ manifest: {...}, results: [...] }`
- **Multi-run file**: `[ { manifest, results }, ... ]`
- **Folder with manifest + suite files**: `manifest.json` + `auth.json`, `checkout.json` etc.
- **Flat results array**: Auto-generates manifest from results

### Key features
- Schema validation with clear error messages
- Auto-detection of file format
- Merge/append runs to existing data
- Clear all / reset to demo mode
- Persist imported data in localStorage
