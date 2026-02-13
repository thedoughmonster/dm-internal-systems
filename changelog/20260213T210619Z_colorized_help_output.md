Date (UTC): 2026-02-13T21:06:19Z
Scope: root (directive cli help UX)

Summary of intent:
- Add color coding to `dc help` output for faster command scanning in terminal.

Files created or modified by this run:
- .directive-cli/scripts/directives/bin/cli

Decisions made:
- Added TTY-aware ANSI color formatting for help output.
- Category headers and command tokens are colorized; non-TTY output remains plain text.
- `NO_COLOR` environment variable disables color output.

Validation performed:
- `dc help`
- `dc test` (pass: 18/18)

Notes on constraints respected:
- No destructive git operations.
- Change limited to CLI help presentation.
