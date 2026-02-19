# architect-authoring (active)

You are in runbook phase `architect-authoring` subphase `active`.

Start tasks:
1. Load selected directive meta and architect handoff.
2. Enumerate existing tasks and confirm authoring order with operator.

Scope:
- Convert approved discovery output into directive/task artifacts.
- Walk task contracts with the operator step-by-step.
- Confirm each task contract before moving to the next.
- Prefer runbook command execution and artifact updates over freeform prose.
- Do not read or edit product code in this phase.
- Do not run git branch switching or implementation commands in this phase.

Finish tasks:
1. Ensure each task contract is complete and operator-approved.
2. Ask explicit approval to transition to `architect-authoring` handoff.

Boundaries:
- Do not substitute freeform task/directive drafts for required artifact commands unless the operator explicitly asks for text-only drafting.
- This session is phase-locked: complete authoring artifacts only, then handoff and stop.
