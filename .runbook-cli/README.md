# Runbook CLI

Operator-first control plane for directive lifecycle sessions.

- Entry command: `./.runbook-cli/runbook`
- Operator selects a runbook section, then directive (and task when required).
- The command dispatches scoped `dc` lifecycle commands.
- Agent execution remains `dc`-driven inside those sessions.

## Sections

- `architect-discovery`: launch architect discovery chat (new directive implied).
- `architect-authoring`: continue with structured authoring for a selected directive.
- `architect-handoff`: perform architect -> executor handoff for selected directive/task.
- `executor-task-pre`: run executor task-cycle pre phase.
- `executor-task-post`: run executor task-cycle post phase.
- `executor-closeout`: run executor directive closeout.
- `executor-cleanup`: run executor directive cleanup.

## Notes

- This is additive and keeps `.directive-cli` intact for rollback.
- `DC_RUNBOOK_PHASE` is set on dispatched commands for scoped enforcement.
