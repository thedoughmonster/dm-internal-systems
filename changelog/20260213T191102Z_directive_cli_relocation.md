Date (UTC): 2026-02-13T19:11:02Z
Scope: root (directive CLI/docs relocation)

Summary of intent:
- Move agentic tooling and rule docs into a dedicated root `.directive-cli/` area.
- Keep existing `dc` command workflows functional during transition.

Files created or modified by this run:
- Moved `ops_tooling/scripts/directives/**` -> `.directive-cli/scripts/directives/**`
- Moved `docs/agent-rules/**` -> `.directive-cli/docs/agent-rules/**`
- Moved `AGENTS.md` -> `.directive-cli/AGENTS.md`
- Added root shim: `AGENTS.md`
- Updated entrypoint: `ops_tooling/scripts/dc`
- Updated docs/index references: `README.md`, `docs/README.md`, `apps/web/docs/guides/agent-guidance.md`
- Updated directive tooling internals and tests under `.directive-cli/scripts/directives/**`
- Updated package test script in `package.json`
- Added compatibility symlinks:
  - `ops_tooling/scripts/directives` -> `.directive-cli/scripts/directives`
  - `docs/agent-rules` -> `.directive-cli/docs/agent-rules`

Decisions made:
- `.directive-cli/AGENTS.md` is the canonical charter; root `AGENTS.md` remains as a minimal compatibility/discovery redirect.
- `dc` remains invoked from `ops_tooling/scripts/dc` but now dispatches to `.directive-cli/scripts/directives/bin/cli`.
- Rule path references and fallback command paths were updated to new `.directive-cli` locations.

Validation performed:
- `ops_tooling/scripts/dc test` (pass: 17/17)
- `ops_tooling/scripts/dc help` (verified command routing)

Notes on constraints respected:
- No destructive git operations.
- Relocation performed with compatibility shims to avoid breaking existing command entrypoints.
