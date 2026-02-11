# Directives Model

## Storage model

- Session root: `apps/web/.local/directives/<guid>/`
- Session intake: `README.md` (non executable)
- Executable tasks: `TASK_<slug>.md`

## Task minimum contract

Every executable task must include:

- Objective
- Constraints
- Allowed files
- Steps
- Validation
- Expected output
- Stop conditions

## Task metadata minimums

Every executable task must include at least:

- `title`
- `status`
- `priority`
- `session_priority`
- `summary`
- `execution_model`
- `thinking_level`

## Status and priority conventions

- `session_priority`: `urgent`, `high`, `medium`, `low`
- `priority`: `urgent`, `high`, `medium`, `low`
- `status`: `todo`, `in_progress`, `blocked`, `done`, `archived`
- `ultra` is reserved for Auditor.

## Priority resolution order

- Global scheduling is determined by session `session_priority`.
- Task `priority` is scoped to ordering tasks inside the selected session only.
- A task in a higher priority session outranks any task in a lower priority session, regardless of task priority values.
