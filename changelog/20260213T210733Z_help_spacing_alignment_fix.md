Date (UTC): 2026-02-13T21:07:33Z
Scope: root (directive cli help formatting)

Summary of intent:
- Fix spacing/alignment regression in colorized help output.

Files created or modified by this run:
- .directive-cli/scripts/directives/bin/cli

Decisions made:
- Replaced printf width formatting on ANSI-colored strings with a padding helper based on uncolored label lengths.
- Preserved colorized output while restoring consistent description column alignment.

Validation performed:
- `dc help`
- `dc test` (pass: 18/18)

Notes on constraints respected:
- No destructive git operations.
- Change limited to CLI help formatting.
