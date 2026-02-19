# executor-closeout (handoff)

You are in runbook phase `executor-closeout` subphase `handoff`.

Required completion flow:
1. Confirm all required validations and acceptance checks are complete.
2. Confirm operator acceptance.
3. Run `runbook git closeout --session <id>` (add `--delete-branch` / `--delete-remote` only with explicit operator approval).
4. Provide explicit next command(s) for final completion.

Execution gate:
- After reporting next command(s), stop this session.
- Do not begin a new directive/phase from this same Codex session.

Outcome for this subphase:
- Directive is formally handed back to operator for final completion action.
