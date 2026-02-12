# Directives Model

## Storage model

- Session root: `apps/web/.local/directives/<guid>/`
- Session intake: `README.md` (non executable)
- Executable tasks: `TASK_<slug>.md`
- Execution handoff artifact (required for profile-based execution): `HANDOFF.md`

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

## Task result update contract

- Executor is the only role that may write task `meta.result`.
- Executor may update `meta.result` only for the task file that was executed.
- Task `meta.result` must include:
  - `summary`: one line factual outcome
  - `validation`: commands run and pass or fail outcomes, or explicit not-run reason
  - `updated`: UTC timestamp
- Executor must not modify task `meta.status`, task `meta.bucket`, task `meta.updated`, or session `README.md` metadata.
- Architect reconciles task and session metadata after execution by using Executor `meta.result` evidence.
- Completion metadata must not be set to done when required validation evidence is missing or failing.

## Collection metadata minimums

If a task belongs to a collection, task metadata must include:

- `collection_id`
- `collection_title`
- `collection_order`
- `collection_commit_label`
- `collection_merge_ready`

Collection rules:

- `collection_id` must be stable within the session and reused by all tasks in the same collection.
- `collection_order` must be an integer starting at `1` for ordering inside a collection.
- `collection_commit_label` must be a short, commit-safe token used for collection completion checkpoint commits.
- `collection_merge_ready` remains `false` until merge-safety evidence is complete.
- A collection is valid only when all tasks in that collection can merge to `dev` without breaking verified behavior.

## Directive branch and commit policy metadata

Session `README.md` metadata must include:

- `directive_branch`
- `directive_base_branch`
- `directive_merge_status`
- `commit_policy`

Branch metadata rules:

- `directive_branch` must be a non empty string.
- Missing or empty `directive_branch` blocks drafting and execution (fail closed).

Value conventions:

- `directive_base_branch`: typically `dev`
- `directive_merge_status`: `open`, `merge_ready`, `merged`, `blocked`
- `commit_policy`: `per_task`, `per_collection`, `end_of_directive`

Lifecycle rules:

- Architect defines branch lifecycle requirements in the directive.
- Architect must ensure `directive_branch` exists before handing off execution.
- Handoff packets for directive execution must include `directive_branch`.
- Executor must verify it is on `directive_branch` before any edits; if the branch does not exist locally, stop and request Architect to create it.
- State-changing branch operations are executed by Executor by default, with Architect `chore/*` exception governed by `AGENTS.md`.
- Completed directives with unmerged branches must be surfaced during Architect startup and resolved or explicitly blocked.
- Open branches are allowed for active blocked or in-progress directives when tracked in session metadata. Untracked stale directive branches are forbidden.

Commit policy rules:

- Do not assume per-task commits.
- If `commit_policy` is `per_collection`, collection completion requires a labeled checkpoint commit using `collection_commit_label`.
- If `commit_policy` is `end_of_directive`, task completion may occur without intermediate commits.
- Missing or invalid `commit_policy` blocks execution.

## Collection merge-safety evidence

`collection_merge_ready` may be treated as satisfied only when evidence includes:

- all tasks in the collection are complete
- required validation commands for the collection passed in this repository
- no unresolved blocking risks that would make merge unsafe
- explicit statement that merge to `dev` is expected to be non-breaking based on executed validation

## Status and priority conventions

- `session_priority`: `urgent`, `high`, `medium`, `low`
- `priority`: `urgent`, `high`, `medium`, `low`
- `status`: `todo`, `in_progress`, `blocked`, `done`, `archived`
- `ultra` is reserved for Auditor.

## Priority resolution order

- Global scheduling is determined by session `session_priority`.
- Task `priority` is scoped to ordering tasks inside the selected session only.
- A task in a higher priority session outranks any task in a lower priority session, regardless of task priority values.
