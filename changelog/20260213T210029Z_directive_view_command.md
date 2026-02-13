Date (UTC): 2026-02-13T21:00:29Z
Scope: root (directive cli view feature)

Summary of intent:
- Add a dedicated view feature for directive artifacts under the new grouped command taxonomy.

Files created or modified by this run:
- .directive-cli/scripts/directives/view_directive.mjs
- .directive-cli/scripts/directives/bin/viewdirective
- .directive-cli/scripts/directives/bin/cli
- .directive-cli/scripts/directives/scripts.test.mjs

Decisions made:
- Added `dc directive view` command for viewing directive JSON files.
- Supports non-interactive usage via `--directive <session>` and `--file <name>`.
- Supports interactive prompt flow (directive selection then file selection) with colored menus.
- Added optional `--raw` output mode to print file contents without pretty JSON formatting.

Validation performed:
- `dc test` (pass: 18/18)

Notes on constraints respected:
- No destructive git operations.
- Change limited to directive CLI view functionality and tests.
