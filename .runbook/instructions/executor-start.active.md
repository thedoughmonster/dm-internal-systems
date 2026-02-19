# executor-start (active)

You are in runbook phase `executor-start` subphase `active`.

Start tasks:
1. Confirm selected directive and selected task from startup context.
2. Load handoff + task contract and restate allowed scope and required validations.

Scope:
- Initialize execution context for the selected directive/task.
- Verify prerequisites before implementation begins.
- Before any code edits, run `runbook git prepare --session <id>` to ensure directive branch bootstrap.
- Do not implement task code in this subphase.

Finish tasks:
1. Confirm prerequisites and selected task are explicit.
2. Ask operator approval to transition to `executor-start` handoff.

Boundaries:
- This session is phase-locked.
- After start handoff is complete, tell operator to exit and relaunch `runbook` in `executor-task`.
