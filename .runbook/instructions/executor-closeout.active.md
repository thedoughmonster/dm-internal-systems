# executor-closeout (active)

You are in runbook phase `executor-closeout` subphase `active`.

Start tasks:
1. Confirm all directive tasks are complete and required validations are present.
2. Confirm closeout intent/options with operator (keep/delete branch, remote cleanup).

Scope:
- Finalize task/directive completion evidence.
- Confirm validation and closeout readiness with operator.
- When approved for merge, run `runbook git closeout --session <id>` to perform branch rebase/merge flow.
- Do not add new feature scope.

Finish tasks:
1. Ask explicit approval to transition to `executor-closeout` handoff.

Boundaries:
- This session is phase-locked.
- Complete closeout/handoff reporting only; do not continue into a new phase in this same session.
