# Role Handoff Audit

Date: 2026-02-11
Scope: `AGENTS.md`, `.directive-cli/docs/agent-rules/**`

## Objective

Identify where instructions require role switching and define a fully automatic handoff protocol for those cases.

## Findings

1. Architect to Executor trigger exists
- Source: `.directive-cli/docs/agent-rules/architect/startup-and-initialization.md`
- Condition: detects `meta.session_priority: ultra`
- Prior state: manual stop and generic handoff language
- Gap: no strict packet format or receiver behavior

2. Auditor to Executor trigger exists
- Source: `.directive-cli/docs/agent-rules/auditor/purpose-and-ultra-priority.md`
- Condition: ultra enforcement execution required
- Prior state: prompt operator to proceed with Executor mode
- Gap: manual and non deterministic transition

3. Executor to Architect trigger exists implicitly
- Source: `.directive-cli/docs/agent-rules/executor/*`
- Condition: scope or contract block
- Prior state: stop and report, but no formal transition contract
- Gap: unresolved blocks required manual interpretation

4. Pair to Architect trigger exists implicitly
- Source: `.directive-cli/docs/agent-rules/pair/boundaries.md`
- Condition: request exceeds `apps/web` cleanup scope
- Prior state: stop and ask direction
- Gap: no automatic escalation packet

5. Global protocol gap
- Source: `AGENTS.md`
- Prior state: strict role selection and no in-thread transition protocol
- Gap: no exception path for automatic handoff execution continuity

## Implemented hardening

1. Added shared protocol module
- `.directive-cli/docs/agent-rules/shared/role-handoff-automation.md`
- Defines packet schema, sender and receiver behavior, trigger matrix, and no manual confirmation mode.

2. Updated critical enforcement linkage
- `.directive-cli/docs/agent-rules/shared/critical-enforcement.md`
- Role lock now routes through automatic handoff protocol when boundary is reached.

3. Updated role prerequisites
- `.directive-cli/docs/agent-rules/*/README.md` now include shared handoff module as mandatory reading.

4. Updated role specific trigger behavior
- Architect startup now emits automatic handoff packet for ultra trigger.
- Auditor ultra policy now emits automatic handoff packet.
- Executor startup supports inbound auto handoff and outbound block handoff.
- Pair boundaries now require automatic handoff packet on out-of-scope requests.

5. Updated root charter exception
- `AGENTS.md` now allows in-thread role transitions only through valid handoff packet protocol or explicit operator role reset.

## Expected operational behavior

- Trigger reached in sender role
- Sender emits strict handoff packet and stops
- Receiver role treats packet `to_role` as explicit assignment
- Receiver completes required reading and continues immediately
- No extra confirmation required for trigger-based handoff

## Residual risk

- Runtime enforcement is still policy driven in docs.
- If execution clients ignore packet protocol, handoff remains manual.
