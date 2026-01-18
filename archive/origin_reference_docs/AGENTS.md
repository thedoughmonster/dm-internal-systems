# Codex Agent Instructions (canonical)

Read and obey, in this order:
1) AI_AUTHORITY.md
2) docs/architecture/INDEX.md (and any documents linked from it)

Rules:
- Prefer minimal diffs.
- Do not invent new files or folders unless explicitly instructed.
- No refactors unless explicitly requested.
- If instructions conflict or required context is missing: STOP and ask.
- After changes, run: ./scripts/check (or the repo’s standard check command) and report results.
