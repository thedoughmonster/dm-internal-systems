# Startup And Initialization

## Startup actions

1. If valid incoming auto handoff packet targets Architect, treat role assignment as satisfied, complete required reading, and continue with packet context without manual role selection prompt.
2. Otherwise confirm role assignment and required reading.
3. List non archived sessions from `apps/web/.local/directives/` with numbered, human readable metadata unless valid incoming packet already provides session and objective context.
4. If any session has `meta.auto_run: true`, set those sessions to `open`, normalize metadata, and remove placeholders.
5. Select auto run target by highest priority, then earliest created timestamp.
6. Set selected auto run session to `in_progress` and report changes made.
7. If any session has `meta.session_priority: ultra`, emit automatic Architect to Executor handoff packet using `trigger: architect_ultra_detected` and stop.
8. Rewrite selected session summary and request operator confirmation before drafting tasks unless execution context came from valid incoming handoff packet.
9. Verify selected README has `meta.title` and `meta.summary`; stop if missing.
10. Verify selected README has `directive_branch`, `directive_base_branch`, `directive_merge_status`, and `commit_policy`; block session if any are missing.
11. Flag tasks with missing Validation, empty Allowed files, or invalid collection metadata as blocked.
12. Normalize `effort` to `small`, `medium`, or `large`.
13. Scan for completed directives where `directive_merge_status` is `open` or `merge_ready` and branch is not merged.
14. For merge-ready directives, issue explicit Executor instruction to perform merge to `dev` only after required merge-safety evidence is present; otherwise keep session blocked with missing evidence called out.

Priority rule for startup selection:

- Choose session by `session_priority` before considering any task `priority`.
- Use task `priority` only after a session is selected.

Startup checks are mandatory and fail closed when required branch or commit metadata is missing.

## Metadata normalization defaults

Session defaults:

- `status`
- `bucket`
- `updated`
- `effort`
- `directive_base_branch`
- `directive_merge_status`
- `commit_policy`

Task defaults:

- `status`, `priority`, `session_priority`, `bucket`, `updated`
- `tags`, `effort`, `depends_on`, `blocked_by`, `related`, `summary`
- `execution_model`, `thinking_level`

Normalization rules:

- Preserve non empty `created` values.
- Preserve `auto_run` values.
- Missing `priority` and `session_priority` default to `low`.
- Missing `directive_base_branch` defaults to `dev`.
- Missing `directive_merge_status` defaults to `open`.
- Missing or invalid `commit_policy` blocks execution until corrected.

## Initialization protocol

- List sessions using `meta.title`, `meta.status`, and `meta.session_priority`.
- Do not reference sessions by folder name alone.
- If README is missing, unreadable, or missing `meta.title`, stop and request operator guidance.
- If valid incoming handoff packet includes `session_id` and `task_file`, use those directly and skip manual session selection.
