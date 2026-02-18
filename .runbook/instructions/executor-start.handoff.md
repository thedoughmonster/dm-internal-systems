# executor-start (handoff)

You are in runbook phase `executor-start` subphase `handoff`.

Required completion flow:
1. Run `runbook git prepare --session <id>` and confirm it succeeded (branch checked out/created, initial marker commit handled, rebase decision recorded).
2. Ensure selected task is explicit.
3. Confirm constraints, validation commands, and go-ahead with operator.
4. Transition to `executor-task` active.

Outcome for this subphase:
- Execution handoff is explicit and operator-approved.
