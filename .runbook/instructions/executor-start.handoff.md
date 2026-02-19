# executor-start (handoff)

You are in runbook phase `executor-start` subphase `handoff`.

Required completion flow:
1. Run `runbook git prepare --session <id>` and confirm it succeeded (branch checked out/created, initial marker commit handled, rebase decision recorded).
   - This is the step that materializes the directive branch locally for execution.
2. Ensure selected task is explicit.
3. Confirm constraints, validation commands, and go-ahead with operator.
4. Report explicit next step command: `runbook --phase executor-task --directive <session>`.

Execution gate:
- Do not start implementation in this same session.
- Tell operator to exit and relaunch the next phase command.

Outcome for this subphase:
- Execution handoff is explicit and operator-approved.
