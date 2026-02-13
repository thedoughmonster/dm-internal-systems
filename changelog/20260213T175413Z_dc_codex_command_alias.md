Date (UTC): 2026-02-13T17:54:13Z
Scope: root (ops tooling)

Summary of intent:
- Promote `dc codex` as the primary command namespace for Codex context/profile tooling.
- Keep backward compatibility for existing `dc context` usage.

Files created or modified by this run:
- ops_tooling/scripts/directives/bin/cli
- ops_tooling/scripts/directives/context_bundle.mjs
- ops_tooling/scripts/directives/scripts.test.mjs

Decisions made:
- Added `codex` command routing in CLI and retained `context` as alias.
- Updated help text to document `codex` as canonical.
- Updated bootstrap metadata marker string to `dc codex bootstrap`.
- Added explicit test coverage for the `dc codex` route path.

Validation performed:
- `ops_tooling/scripts/dc test` (pass: 12/12)

Notes on constraints respected:
- No destructive git operations used.
- Changes scoped to directive tooling and tests only.
