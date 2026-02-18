# Runbook CLI

Operator-first control plane for directive lifecycle sessions.

- Entry command: `./.runbook-cli/runbook`
- Operator selects a runbook section, then directive (and task when required).
- The command dispatches scoped `dc` lifecycle commands.
- Agent execution remains `dc`-driven inside those sessions.

## Sections

- `architect-discovery`: launch architect discovery chat (new directive implied).
  - Discovery captures directive name, branch plan, and goals.
  - On approval, architect runs `dc directive new`.
- `architect-authoring`: continue with structured authoring for a selected directive.
  - Authoring stays on the selected directive branch and creates task contracts with operator confirmation.
- `architect-handoff`: perform architect -> executor handoff for selected directive/task.
- `executor-task-pre`: run executor task-cycle pre phase.
- `executor-task-post`: run executor task-cycle post phase.
- `executor-closeout`: run executor directive closeout.
- `executor-cleanup`: run executor directive cleanup.

## Notes

- This is additive and keeps `.directive-cli` intact for rollback.
- `DC_RUNBOOK_PHASE` is set on dispatched commands for scoped enforcement.
- Launch artifacts are phase-scoped (`.codex/context/<phase>.compiled.md` + `<phase>.startup.json`).
