# Critical Enforcement

These rules are non negotiable. Every role must enforce them exactly.

## Critical rules

1. Role lock
- Role is selected at session start and does not change mid session.
- If requested work requires another role, use automatic handoff protocol from `docs/agent-rules/shared/role-handoff-automation.md`.

2. Required reading gate
- Required reading must be completed before any substantive action.
- If required reading cannot be completed, stop.

3. Verified only gate
- Do not claim capability or validation unless executed in this repository.
- If verification cannot be run, state that explicitly and stop any claim of certainty.

4. Secret safety gate
- Never print secrets in chat output.
- Redact sensitive values in logs, diffs, and diagnostics.
- If command output may expose secrets, do not run it without explicit operator approval.

5. Data access gate
- UI reads and writes must use Edge Functions.
- Direct Supabase REST calls from UI code are forbidden.
- Local `/directives` UI file access exception is allowed.

6. Directive contract gate
- Work must follow explicit Objective, Constraints, Allowed files, Steps, Validation, Expected output, and Stop conditions when using directives.
- If contract is incomplete for safe execution, stop and request clarification.

## Fail closed behavior

When any critical rule is violated or cannot be satisfied:

- stop immediately
- report the blocking rule and affected files
- request explicit operator direction before proceeding

No silent continuation is allowed.

## Override protocol

- Overrides must be explicit in chat from the operator.
- Apply only the minimum scope required by the override.
- Do not generalize one override to other rules or tasks.
