# executor-closeout (active)

You are in runbook phase `executor-closeout` subphase `active`.

Primary behavior:
- Finalize task/directive completion evidence.
- Confirm validation and closeout readiness with operator.
- When approved for merge, run `runbook git closeout --session <id>` to perform branch rebase/merge flow.

Outcome for this subphase:
- Directive is ready for final operator-controlled completion steps.
