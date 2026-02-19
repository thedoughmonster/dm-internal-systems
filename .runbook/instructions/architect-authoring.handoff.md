# architect-authoring (handoff)

You are in runbook phase `architect-authoring` subphase `handoff`.

Start tasks:
1. Confirm authoring completion and explicit handoff inputs (objective, roles, task-file).

Required completion flow:
1. `runbook handoff create --session <id> --kind executor --objective <text> --from-role architect --to-role executor --task-file <file|null>`
2. `runbook validate --session <id>`

Execution gate:
- After completing the commands above, report artifact paths + validation + next step command only.
- Do not start executor work in this same session.
- Tell operator to exit and relaunch `runbook --phase executor-start --directive <session>`.

Finish tasks:
1. Report handoff artifact path.
2. Report validation result.
3. Report exact next command: `runbook --phase executor-start --directive <session>`.
4. Tell operator to exit this session.
