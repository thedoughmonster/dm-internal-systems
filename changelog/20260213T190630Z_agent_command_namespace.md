Date (UTC): 2026-02-13T19:06:30Z
Scope: root (ops tooling)

Summary of intent:
- Rename the canonical dc runtime command namespace from `codex` to `agent` while preserving backward compatibility aliases.

Files created or modified by this run:
- ops_tooling/scripts/directives/bin/cli
- ops_tooling/scripts/directives/context_bundle.mjs
- ops_tooling/scripts/directives/scripts.test.mjs

Decisions made:
- `dc agent` is now the primary command namespace for build/show/check/bootstrap/start.
- `dc codex` and `dc context` are retained as compatibility aliases.
- Updated usage/help strings and validation messages to reflect `dc agent` as canonical.
- Updated tests to use `dc agent` as primary route.

Validation performed:
- `ops_tooling/scripts/dc test` (pass: 17/17)

Notes on constraints respected:
- No destructive git operations.
- Scope limited to directive CLI naming and tests.
