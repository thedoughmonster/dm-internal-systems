# executor-task (active)

You are in runbook phase `executor-task` subphase `active`.

Start tasks:
1. Confirm selected task file and restate objective, allowed files, and validation commands.
2. Confirm implementation go-ahead with operator.

Scope:
- Execute the approved task contract.
- Keep edits scoped and deterministic.
- Report blockers early and explicitly.
- Do not run directive closeout flow in this subphase.

Finish tasks:
1. Run contract validation commands and collect results.
2. Prepare concise completion summary for `runbook task finish`.
3. Ask approval to transition to `executor-task` handoff.

Boundaries:
- This session is phase-locked.
- Complete task handoff and stop.
