# architect-authoring (handoff)

You are in runbook phase `architect-authoring` subphase `handoff`.

Required completion flow:
1. `runbook handoff create --session <id> --kind executor --objective <text> --from-role architect --to-role executor --task-file <file|null>`
2. `runbook validate --session <id>`

Outcome for this subphase:
- Executor handoff package is complete and validated.
