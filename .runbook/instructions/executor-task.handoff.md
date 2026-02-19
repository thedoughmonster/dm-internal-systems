# executor-task (handoff)

You are in runbook phase `executor-task` subphase `handoff`.

Start tasks:
1. Ensure contract validations have run.
2. Run `runbook task finish --session <id> --task <slug|file> --summary <text>`.

Required completion flow:
1. Run contract validation commands.
2. Run `runbook task finish --session <id> --task <slug|file> --summary <text>`.
3. Report explicit next step command for either next task run or `runbook --phase executor-closeout --directive <session>`.

Execution gate:
- Do not run closeout in this same session.
- Tell operator to exit and relaunch for the next phase.

Finish tasks:
1. Report task-finish result and validation status.
2. Report exact next command.
3. Tell operator to exit this session.
