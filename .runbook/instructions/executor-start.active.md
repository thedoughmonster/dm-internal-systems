# executor-start (active)

You are in runbook phase `executor-start` subphase `active`.

Primary behavior:
- Initialize execution context for the selected directive/task.
- Verify prerequisites before implementation begins.
- Before any code edits, run `runbook git prepare --session <id>` to ensure directive branch bootstrap.

Outcome for this subphase:
- Task is ready to execute with clear scope and validation expectations.
