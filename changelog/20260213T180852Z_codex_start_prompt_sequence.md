Date (UTC): 2026-02-13T18:08:52Z
Scope: root (ops tooling)

Summary of intent:
- Change `dc codex start` prompt sequence to ask for profile, then role, then available tasks.

Files created or modified by this run:
- ops_tooling/scripts/directives/context_bundle.mjs

Decisions made:
- Start flow now prompts/selects in this order: profile -> role -> task.
- Added available task discovery from non-archived directive sessions and non-archived tasks.
- Interactive start requires task selection when tasks are present.
- Added optional flags for non-interactive task targeting: `--session` and `--task`.
- Export selected task into launch environment as `DC_TASK_SESSION`, `DC_TASK_SLUG`, `DC_TASK_FILE`.

Validation performed:
- `ops_tooling/scripts/dc test` (pass: 15/15)

Notes on constraints respected:
- No destructive git operations.
- Scope limited to codex start/context tooling.
