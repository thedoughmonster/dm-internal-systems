# Discovery And Startup

## Directive discovery

- Session path: `apps/web/.local/directives/<session_dir>/`
- Intake file: `<directive_slug>.meta.json` (non executable)
- Executable file: `<task_slug>.task.json`

Executor selection input:

- explicit task path, or
- numeric session selection from numbered list

## Startup actions

0. If startup context from `dc agent start` already provides role and selected directive/task, skip manual role confirmation and broad session/task discovery; proceed directly with that context.
1. If valid incoming `<directive_slug>.handoff.json` targets Executor, treat role selection as satisfied, complete required reading, and continue without manual role selection prompt.
2. If valid incoming `<directive_slug>.handoff.json` provides `handoff.task_file`, verify and read that task directly, then skip manual session and directive selection prompts.
3. If no valid incoming `<directive_slug>.handoff.json` is present, operator-selected session and task via `dc` lifecycle commands or runbooks is valid execution context.
4. If no explicit task path is provided and session exists with `meta.auto_run: true` and `meta.status: in_progress`, select highest `session_priority` then earliest `created`, load that session `<directive_slug>.handoff.json`, and proceed directly when it resolves a single executable task.
5. Otherwise if task path provided, verify and read task fully.
6. If execution context is still unresolved, list non archived sessions with numbered output.
7. Include `meta.title`, `meta.status`, and `meta.session_priority` in session list.
8. Stop if session metadata `<directive_slug>.meta.json` is missing, unreadable, or missing `meta.title`.

## Branch gate

Before any edits:

- Require `handoff.directive_branch` from `<directive_slug>.handoff.json`.
- Require `directive_branch` to be non empty.
- Verify current git branch matches `directive_branch`; if not, switch to `directive_branch`.
- If `directive_branch` does not exist locally, `dc directive start` may create it from `directive_base_branch` according to directive metadata.
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
- If valid incoming `<directive_slug>.handoff.json` provides task context, skip manual selection prompts.
- If valid handoff or eligible auto-run context resolves a single executable task, start execution directly with no operator confirmation prompts.
- Prompt for manual directive or task selection only when handoff and auto-run context do not resolve a single executable task.

## Pre execution gate

Before edits, enforce task contract and metadata minimums from `.directive-cli/docs/agent-rules/shared/directives-model.md`.
Do not request operator confirmation for `meta.execution_model` or `meta.thinking_level` when execution context is already resolved by valid handoff or auto-run selection.
Enforce worktree state contract before edits:
- `clean_required`: fail closed if `git status --short` reports tracked or untracked changes.
- `known_dirty_allowlist`: fail closed unless every dirty path matches `worktree_allowlist_paths` exactly.
- If additional dirty paths appear beyond allowlist, stop and emit Executor to Architect handoff with exact path list.

## Directive metadata handling

- Do not manually edit directive metadata in normal flow.
- Executor metadata updates must use:
  - `executor-updatemeta ...`
  - fallback: `node .directive-cli/scripts/directives/update_directive_metadata.mjs --role executor ...`
- Executor must not update session `<directive_slug>.meta.json` via tooling.
- Executor must not manually update task `meta.bucket`.
- `dc task start` and `dc task finish` may update task `meta.status` and `meta.updated` via lifecycle tooling.

## Automatic outbound handoff

If Executor cannot continue due to scope or contract block, write `<directive_slug>.handoff.json` for Architect using `trigger: executor_scope_or_contract_block` and stop.
