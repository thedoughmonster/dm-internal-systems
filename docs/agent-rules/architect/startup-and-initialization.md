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
10. Flag tasks with missing Validation or empty Allowed files as blocked.
11. Normalize `effort` to `small`, `medium`, or `large`.

Priority rule for startup selection:

- Choose session by `session_priority` before considering any task `priority`.
- Use task `priority` only after a session is selected.

## Metadata normalization defaults

Session defaults:

- `status`
- `bucket`
- `updated`
- `effort`

Task defaults:

- `status`, `priority`, `session_priority`, `bucket`, `updated`
- `tags`, `effort`, `depends_on`, `blocked_by`, `related`, `summary`
- `execution_model`, `thinking_level`

Normalization rules:

- Preserve non empty `created` values.
- Preserve `auto_run` values.
- Missing `priority` and `session_priority` default to `low`.

## Initialization protocol

- List sessions using `meta.title`, `meta.status`, and `meta.session_priority`.
- Do not reference sessions by folder name alone.
- If README is missing, unreadable, or missing `meta.title`, stop and request operator guidance.
- If valid incoming handoff packet includes `session_id` and `task_file`, use those directly and skip manual session selection.
