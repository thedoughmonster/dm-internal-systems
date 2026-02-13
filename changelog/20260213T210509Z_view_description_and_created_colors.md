Date (UTC): 2026-02-13T21:05:09Z
Scope: root (directive view UX)

Summary of intent:
- Refine `dc directive view` output to emphasize description-first selection and surface created metadata visually.

Files created or modified by this run:
- .directive-cli/scripts/directives/view_directive.mjs

Decisions made:
- File selection menu now shows description only (no filename text in menu rows).
- Description text in file menu is blue.
- Created metadata is shown in green in the file menu when present.
- Selected file output now prints a green `created:` line before content when created metadata exists.

Validation performed:
- `dc test` (pass: 18/18)

Notes on constraints respected:
- No destructive git operations.
- Change limited to directive view presentation.
