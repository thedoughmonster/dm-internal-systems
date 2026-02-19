# executor-closeout (handoff)

You are in runbook phase `executor-closeout` subphase `handoff`.

Start tasks:
1. Confirm operator acceptance for closeout.
2. Run `runbook git closeout --session <id>` with only approved flags.

Required completion flow:
1. Confirm all required validations and acceptance checks are complete.
2. Confirm operator acceptance.
3. Run `runbook git closeout --session <id>` (add `--delete-branch` / `--delete-remote` only with explicit operator approval).
4. Provide explicit next command(s) for final completion.

Execution gate:
- After reporting next command(s), stop this session.
- Do not begin a new directive/phase from this same Codex session.

Finish tasks:
1. Report closeout result (merge outcome, branch status, cleanup actions).
2. Report explicit next command(s) for operator.
3. Tell operator this session is complete and should end.
