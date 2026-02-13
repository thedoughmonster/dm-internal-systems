Date (UTC): 2026-02-13T19:04:02Z
Scope: root (ops tooling)

Summary of intent:
- Add `dc init` to capture default agent/model settings and apply them to codex start workflow.

Files created or modified by this run:
- ops_tooling/scripts/directives/bin/cli
- ops_tooling/scripts/directives/bin/init
- ops_tooling/scripts/directives/init_companion.mjs
- ops_tooling/scripts/directives/context_bundle.mjs
- ops_tooling/scripts/directives/scripts.test.mjs

Decisions made:
- Added `dc init` command with interactive/non-interactive support.
- Config file defaults to `.codex/dc.config.json` and stores selected `agent.name` and `model.name`.
- `dc codex start` now reads dc config and rejects non-codex agent selection for the codex launcher path.
- `dc codex start` exports `DC_AGENT` and `DC_MODEL` env vars to the launched process.

Validation performed:
- `ops_tooling/scripts/dc test` (pass: 17/17)

Notes on constraints respected:
- No destructive git operations.
- Changes scoped to directive/codex wrapper tooling.
