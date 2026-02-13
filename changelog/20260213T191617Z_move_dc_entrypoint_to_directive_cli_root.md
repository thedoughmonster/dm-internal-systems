Date (UTC): 2026-02-13T19:16:17Z
Scope: root (directive cli entrypoint)

Summary of intent:
- Move the `dc` entrypoint out of `ops_tooling/scripts` into `.directive-cli`.

Files created or modified by this run:
- Added `.directive-cli/dc`
- Removed `ops_tooling/scripts/dc`

Decisions made:
- `.directive-cli/dc` is now the primary launcher for directive CLI commands.
- Entry point now directly dispatches to `.directive-cli/scripts/directives/bin/cli`.
- Removed the old scripts-based entrypoint per operator request.

Validation performed:
- `.directive-cli/dc help` (command routing verified)
- `.directive-cli/dc test` (pass: 17/17)

Notes on constraints respected:
- No destructive git reset/checkout operations.
- Removal limited to explicitly requested legacy entrypoint.
