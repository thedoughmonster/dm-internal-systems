Date (UTC): 2026-02-13T19:13:56Z
Scope: root (directive cli cleanup)

Summary of intent:
- Remove compatibility-only command aliases and symlink paths now that `.directive-cli` is the only supported location.

Files created or modified by this run:
- .directive-cli/scripts/directives/bin/cli
- .directive-cli/scripts/directives/scripts.test.mjs
- Removed symlink: docs/agent-rules
- Removed symlink: ops_tooling/scripts/directives

Decisions made:
- `dc` supports only `agent` as the runtime command namespace (no `codex` or `context` aliases).
- Removed legacy symlinked paths for directive scripts and agent rules.
- Kept `ops_tooling/scripts/dc` as the single stable entrypoint.

Validation performed:
- `ops_tooling/scripts/dc test` (pass: 17/17)

Notes on constraints respected:
- Destructive actions were limited to explicitly requested compatibility cleanup (symlink removals).
- No git reset/checkout/revert operations used.
