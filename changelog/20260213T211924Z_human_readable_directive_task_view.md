Date (UTC): 2026-02-13T21:19:24Z
Scope: root (directive view rendering)

Summary of intent:
- Add basic parsed human-readable rendering for directive task JSON in `dc directive view`.

Files created or modified by this run:
- .directive-cli/scripts/directives/view_directive.mjs
- .directive-cli/scripts/directives/scripts.test.mjs

Decisions made:
- `directive_task` files now render with structured sections (meta summary, objective, constraints, allowed files, steps, validation commands, expected output, stop conditions).
- Non-task JSON files render a compact metadata header and a content block.
- `--raw` continues to print exact raw JSON without formatting.

Validation performed:
- `dc test` (pass: 18/18)

Notes on constraints respected:
- No destructive git operations.
- Change limited to read/view output behavior and associated tests.
