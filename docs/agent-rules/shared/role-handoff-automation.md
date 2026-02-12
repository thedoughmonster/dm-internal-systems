# Role Handoff Automation

This module defines automatic handoff behavior when a role boundary is reached.

## Handoff contract

Automatic handoff is valid only when sender emits a complete handoff packet.

Required packet format:

```text
=== AUTO HANDOFF ===
from_role: <architect|executor|pair|auditor>
to_role: <architect|executor|pair|auditor>
trigger: <short deterministic trigger id>
session_id: <directive session guid or n/a>
task_file: <task path or n/a>
directive_branch: <non empty git branch name>
required_reading: apps/web/docs/guides/component-paradigm.md
objective: <one line objective for receiving role>
blocking_rule: <rule that prevents sender from continuing>
```

Directive execution rule:

- For any handoff that leads to directive execution, `directive_branch` must be present and must be a non empty git branch name.
- `directive_branch` must match the session README `meta.directive_branch` when `session_id` points at a directive session.

## Directive-contained handoff (profile-based execution)

When role selection is handled outside chat (for example via Codex profiles), directive execution must still be gated behind an explicit handoff artifact stored inside the directive session folder.

Required file:

- `apps/web/.local/directives/<guid>/HANDOFF.md`

Required `HANDOFF.md` front matter format:

```text
---
handoff:
  from_role: architect
  to_role: executor
  trigger: <short deterministic trigger id>
  session_id: <directive session guid>
  task_file: <task path>
  directive_branch: <non empty git branch name>
  required_reading: apps/web/docs/guides/component-paradigm.md
  objective: <one line objective>
  blocking_rule: <rule that prevents sender from continuing>
---
```

Rules:

- Executor must treat `HANDOFF.md` as equivalent to a chat `=== AUTO HANDOFF ===` packet.
- `handoff.directive_branch` must match session README `meta.directive_branch`.
- If `HANDOFF.md` is missing, incomplete, or mismatched, Executor must stop.

## Sender behavior

When a handoff trigger is met, sender must:

1. stop execution immediately
2. emit one complete handoff packet
3. avoid additional discretionary work after packet emission

## Receiver behavior

When most recent context contains a valid handoff packet targeting receiver role:

1. treat target role as explicitly selected
2. complete required reading
3. continue execution without requesting manual role re-selection
4. use packet `session_id` and `task_file` when present to continue directly
5. verify current git branch matches `directive_branch` before any edits

If packet is incomplete or malformed, receiver must stop and request correction.

## No-manual-confirmation mode

For trigger-based handoffs defined in this module, role transition should not require additional operator confirmation.

Operator may still interrupt or override at any time.

## Trigger matrix

1. Architect to Executor
- trigger: `architect_ultra_detected`
- condition: any non archived session with `meta.session_priority: ultra`

2. Auditor to Executor
- trigger: `auditor_ultra_open`
- condition: ultra priority enforcement task requires execution role

3. Executor to Architect
- trigger: `executor_scope_or_contract_block`
- condition: allowlist conflict, missing deterministic step detail, or unresolved deviation decision

4. Pair to Architect
- trigger: `pair_out_of_scope`
- condition: requested change exceeds `apps/web` cleanup boundary or requires backend, route, or data model decisions

5. Any role to Architect
- trigger: `role_policy_conflict`
- condition: instruction conflict cannot be resolved inside active role constraints
