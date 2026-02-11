# Discovery And Startup

## Directive discovery

- Session path: `apps/web/.local/directives/<guid>/`
- Intake file: `README.md` (non executable)
- Executable file: `TASK_<slug>.md`

Executor selection input:

- explicit task path, or
- numeric session selection from numbered list

## Startup actions

1. If valid incoming auto handoff packet targets Executor, treat role selection as satisfied, complete required reading, and continue without manual role selection prompt.
2. Otherwise confirm role assignment and required reading.
3. If session exists with `meta.auto_run: true` and `meta.status: in_progress`, select highest priority then earliest created and proceed.
4. If valid incoming handoff packet provides `task_file`, verify and read that task directly.
5. Otherwise if task path provided, verify and read task fully.
6. If no task path, list non archived sessions with numbered output.
7. Include `meta.title`, `meta.status`, and `meta.session_priority` in session list.
8. Stop if README is missing, unreadable, or missing `meta.title`.

Session selection precedence:

- Select session by `session_priority` first.
- Use task `priority` only to order tasks within the selected session.

## Task selection rules

- Do not reference sessions by folder name alone.
- Accept numeric reply as selection and run confirmation.
- If one runnable task exists, run it.
- If multiple runnable tasks exist, list and request numeric selection.
- If no runnable tasks exist, report and stop.
- If valid incoming handoff packet provides task context, skip manual selection prompts.

## Pre execution gate

Before edits, enforce task contract and metadata minimums from `docs/agent-rules/shared/directives-model.md`.
Before each task, request operator confirmation for `meta.execution_model` and `meta.thinking_level` unless execution context was provided by valid incoming handoff packet.

## Automatic outbound handoff

If Executor cannot continue due to scope or contract block, emit automatic Executor to Architect handoff packet using `trigger: executor_scope_or_contract_block` and stop.
