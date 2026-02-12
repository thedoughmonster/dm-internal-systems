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
2. If no valid incoming handoff packet is present, require a directive-contained handoff file `apps/web/.local/directives/<guid>/HANDOFF.md`. If missing, stop and request Architect to create it.
3. If session exists with `meta.auto_run: true` and `meta.status: in_progress`, select highest priority then earliest created and proceed.
4. If valid incoming handoff packet provides `task_file`, verify and read that task directly.
5. Otherwise if task path provided, verify and read task fully.
6. If no task path, list non archived sessions with numbered output.
7. Include `meta.title`, `meta.status`, and `meta.session_priority` in session list.
8. Stop if README is missing, unreadable, or missing `meta.title`.

## Branch gate

Before any edits:

- Require `directive_branch` from the incoming handoff packet or from `HANDOFF.md`.
- Require `directive_branch` to be non empty.
- Verify current git branch matches `directive_branch`; if not, switch to `directive_branch`.
- If `directive_branch` does not exist locally, stop and request Architect to create it before continuing.

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
