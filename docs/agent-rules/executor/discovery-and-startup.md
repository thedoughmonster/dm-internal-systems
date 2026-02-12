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
2. If valid incoming handoff packet provides `task_file`, verify and read that task directly, then skip manual session and directive selection prompts.
3. If no valid incoming handoff packet is present, require a directive-contained handoff file `apps/web/.local/directives/<guid>/HANDOFF.md` before directive execution. If missing, stop and request Architect to create it.
4. If no explicit task path is provided and session exists with `meta.auto_run: true` and `meta.status: in_progress`, select highest `session_priority` then earliest `created`, load that session `HANDOFF.md`, and proceed directly when it resolves a single executable task.
5. Otherwise if task path provided, verify and read task fully.
6. If execution context is still unresolved, list non archived sessions with numbered output.
7. Include `meta.title`, `meta.status`, and `meta.session_priority` in session list.
8. Stop if README is missing, unreadable, or missing `meta.title`.

## Branch gate

Before any edits:

- Require `directive_branch` from the incoming handoff packet or from `HANDOFF.md`.
- Require `directive_branch` to be non empty.
- Verify current git branch matches `directive_branch`; if not, switch to `directive_branch`.
- If `directive_branch` does not exist locally, stop and request Architect to create it before continuing.
- Require explicit worktree mode from handoff context:
  - `clean_required`
  - `known_dirty_allowlist` with explicit `worktree_allowlist_paths`
- If worktree mode metadata is missing or invalid, stop and request Architect correction.

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
- If valid handoff or eligible auto-run context resolves a single executable task, start execution directly with no operator confirmation prompts.
- Prompt for manual directive or task selection only when handoff and auto-run context do not resolve a single executable task.

## Pre execution gate

Before edits, enforce task contract and metadata minimums from `docs/agent-rules/shared/directives-model.md`.
Do not request operator confirmation for `meta.execution_model` or `meta.thinking_level` when execution context is already resolved by valid handoff or auto-run selection.
Enforce worktree state contract before edits:
- `clean_required`: fail closed if `git status --short` reports tracked or untracked changes.
- `known_dirty_allowlist`: fail closed unless every dirty path matches `worktree_allowlist_paths` exactly.
- If additional dirty paths appear beyond allowlist, stop and emit Executor to Architect handoff with exact path list.

## Automatic outbound handoff

If Executor cannot continue due to scope or contract block, emit automatic Executor to Architect handoff packet using `trigger: executor_scope_or_contract_block` and stop.
