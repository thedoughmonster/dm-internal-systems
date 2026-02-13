Date (UTC): 2026-02-13T17:59:57Z
Scope: root (ops tooling)

Summary of intent:
- Add a single command path to start Codex via `dc`, including required profile selection and bootstrap wiring.

Files created or modified by this run:
- ops_tooling/scripts/directives/context_bundle.mjs
- ops_tooling/scripts/directives/bin/cli
- ops_tooling/scripts/directives/scripts.test.mjs

Decisions made:
- Added `dc codex start` command.
- `start` requires profile selection (prompt/list in TTY, `--profile` in non-interactive).
- `start` bootstraps profile by default before launch; supports `--no-bootstrap` override.
- Added `--codex-bin` to support custom launcher binaries and testability.

Validation performed:
- `ops_tooling/scripts/dc test` (pass: 13/13)

Notes on constraints respected:
- No destructive git operations.
- Change scope limited to directive/codex tooling.
