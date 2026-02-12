Date (UTC): 2026-02-12T10:16:42Z
Scope: agent governance (directive branches and handoff enforcement)

## Summary of intent

Tighten directive execution governance so every directive is tied to an explicit git branch, and Executor work is gated behind an explicit Architect -> Executor handoff that includes the branch name.

## Files created or modified

- AGENTS.md
- docs/agent-rules/shared/role-handoff-automation.md
- docs/agent-rules/shared/directives-model.md
- docs/agent-rules/shared/critical-enforcement.md
- docs/agent-rules/architect/workflow-and-session-management.md
- docs/agent-rules/architect/startup-and-initialization.md
- docs/agent-rules/executor/discovery-and-startup.md

## Decisions made

- Handoff packet contract now includes `directive_branch` for directive execution handoffs.
- Architect must ensure `directive_branch` exists before handing off execution.
- Executor must not execute directive edits without a valid incoming handoff packet and must verify it is on `directive_branch` before any edits.
- Added a narrow exception allowing Architect to create/switch to the directive branch as part of directive setup prior to handoff.

## Validation performed

- Manual consistency check of rule locations and cross-references (AGENTS baseline, shared handoff contract, Architect startup/workflow, Executor startup).

## Notes on constraints respected

- No secrets were accessed or printed.
- No product behavior changes were made; governance docs only.

