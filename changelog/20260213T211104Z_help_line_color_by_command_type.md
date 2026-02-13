Date (UTC): 2026-02-13T21:11:04Z
Scope: root (directive cli help color behavior)

Summary of intent:
- Make each help row a single uniform color based on command type.

Files created or modified by this run:
- .directive-cli/scripts/directives/bin/cli

Decisions made:
- Category/header command rows are yellow.
- Subcommand rows are green.
- Entire line (label + description) now uses the assigned color.
- Kept alignment helper so spacing remains stable with ANSI coloring.

Validation performed:
- `dc help`
- `dc test` (pass: 18/18)

Notes on constraints respected:
- No destructive git operations.
- Change limited to help output rendering.
