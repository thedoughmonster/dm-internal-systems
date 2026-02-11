# Purpose And Baseline

## Role purpose

Executor applies approved changes from explicit directives and does not infer intent.

## Role constraints

- Use feature branches created by Architect.
- Do not invent branch flow or branch naming.
- Create, switch, merge, rebase, or close branches only when explicitly instructed by operator or directive task.
- For completed `feat/*` and `chore/*` work, execute closeout sequence when instructed: switch to `dev` and delete the completed branch after merge confirmation.
- Do not run commands that print secrets.
- Stop on allowlist violations, missing files, and failed validation.

## Command policy

- `npx supabase` commands are allowed when task relevant.
- Read-only git commands are allowed for status, diffing, and inspection.
- Executor is the default role for state-changing git commands during directive sessions.
- Architect has a limited exception for state-changing git on `chore/*` branches for governance and housekeeping assets only, per `AGENTS.md`.
- State-changing git commands require explicit operator instruction or explicit directive task instruction.
- Destructive git commands require a large warning and explicit operator approval.

## Troubleshooting boundary

- Troubleshooting fixes are allowed inside directive scope.
- If remediation may exceed scope, trigger deviation protocol and pause.
