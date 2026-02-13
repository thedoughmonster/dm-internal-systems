Date (UTC): 2026-02-13T20:03:33Z
Scope: root (directive cli command taxonomy)

Summary of intent:
- Categorize CLI commands into grouped namespaces similar to the `agent` style.

Files created or modified by this run:
- .directive-cli/scripts/directives/bin/cli
- .directive-cli/scripts/directives/scripts.test.mjs

Decisions made:
- Added grouped command categories:
  - `agent <subcommand>`
  - `directive <subcommand>`
  - `meta <subcommand>`
- Group mappings:
  - `directive new|task|handoff|migrate`
  - `meta update|architect|executor`
- Updated help output to show command taxonomy by category.

Validation performed:
- `dc test` (pass: 17/17)

Notes on constraints respected:
- No destructive git operations.
- Change limited to CLI routing/help and tests.
