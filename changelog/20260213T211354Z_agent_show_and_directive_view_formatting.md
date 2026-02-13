Date (UTC): 2026-02-13T21:13:54Z
Scope: root (directive cli show/view formatting)

Summary of intent:
- Add basic human-readable formatting and colorized metadata output for `agent show` and `directive view`.

Files created or modified by this run:
- .directive-cli/scripts/directives/context_bundle.mjs
- .directive-cli/scripts/directives/view_directive.mjs

Decisions made:
- `agent show` now renders structured metadata lines for bundle path, role, meta file, hash, and source count in non-JSON mode.
- `agent show --all-roles` now renders a readable role summary list in non-JSON mode.
- `directive view` now prints a human-readable header (directive, file, description, created, separator) before content.
- JSON output mode behavior remains unchanged for machine-readable consumers.

Validation performed:
- `dc test` (pass: 18/18)

Notes on constraints respected:
- No destructive git operations.
- Change limited to output formatting for show/view commands.
