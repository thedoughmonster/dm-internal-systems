Date (UTC): 2026-02-13T18:14:15Z
Scope: root (ops tooling)

Summary of intent:
- Update `dc codex` interactive UX: require directive selection before optional task selection in `start`, and add colorized selection menus.
- Add interactive directive->file flow for view usage.

Files created or modified by this run:
- ops_tooling/scripts/directives/context_bundle.mjs
- ops_tooling/scripts/directives/bin/cli

Decisions made:
- `dc codex start` prompt order is now profile -> role -> directive (required) -> task (optional).
- Task picker is scoped to the selected directive and supports skip (`0`).
- Added colorized menus for profile, role, directive, task, and file selection in TTY.
- `dc codex show` with no bundle flags now prompts for directive then file and prints that file.
- Existing bundle metadata behavior for show remains available via explicit flags (`--out/--meta/--role/--all-roles/--print`).

Validation performed:
- `ops_tooling/scripts/dc test` (pass: 15/15)

Notes on constraints respected:
- No destructive git operations.
- Changes scoped to codex/directive CLI tooling.
