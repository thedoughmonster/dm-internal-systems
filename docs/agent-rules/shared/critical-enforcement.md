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
- Missing required commit checkpoint or unresolved merge-safety evidence is fail-closed and blocks continuation.

7. Git authority gate
- During directive sessions, state-changing git commands are Executor-owned by default.
- Architect may run state-changing git commands only on `chore/*` branches, with explicit operator instruction or explicit directive task instruction.
- Exception: Architect may create and switch to the directive branch only when it is a `chore/*` branch, as part of directive setup prior to Executor handoff.
- Architect `chore/*` state-changing git is limited to governance and housekeeping assets only: `AGENTS.md`, `docs/**`, `changelog/**`, `apps/web/changelog/**`, `apps/web/.local/directives/**`, and `ops_tooling/**`.
- If planned or staged files include product code, Architect must stop and hand off to Executor before any state-changing git.
- Architect state-changing commits on `chore/*` must use commit subject prefix `chore(architect):`.
- Architect must not run state-changing git on `feat/*`, `fix/*`, `dev`, or `prod`.
- Non-Executor roles other than Architect may use read-only git inspection commands only.
- If state-changing git is required outside these rules, write `<directive_slug>.handoff.json` for the next role or request explicit operator role reset.

8. Unexpected changes gate
- If unexpected working tree changes are detected, stop immediately and report.
- Exception: changes explicitly declared through handoff `worktree_mode: known_dirty_allowlist` and exact `worktree_allowlist_paths` are treated as expected for that handoff only.

9. Governance ownership gate
- Governance rule updates in `AGENTS.md`, `docs/agent-rules/**`, and `apps/web/docs/guides/agent-guidance.md` are Architect-owned.
- For governance-only rule updates, Architect executes end to end on a dedicated `chore/*` branch and does not hand off implementation to Executor.

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
