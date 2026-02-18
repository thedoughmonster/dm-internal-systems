# Role Handoff Automation

This module defines automatic handoff behavior when a role boundary is reached.

## Handoff contract

Automatic handoff is valid only when sender writes a complete session-local handoff artifact.

Required artifact path:

- `.directive-cli/directives/<session_dir>/<directive_slug>.handoff.json`

Required `<directive_slug>.handoff.json` format:

```json
{
  "handoff": {
    "from_role": "<architect|executor|pair|auditor>",
    "to_role": "<architect|executor|pair|auditor>",
    "trigger": "<short deterministic trigger id>",
    "session_id": "<directive session UUID from <directive_slug>.meta.json meta.id or null>",
    "task_file": "<task path or null>",
    "directive_branch": "<non empty git branch name>",
    "required_reading": "apps/web/docs/guides/component-paradigm.md",
    "objective": "<one line objective for receiving role>",
    "blocking_rule": "<rule that prevents sender from continuing>",
    "worktree_mode": "<clean_required|known_dirty_allowlist>",
    "worktree_allowlist_paths": []
  }
}
```

Directive execution rule:

- For any handoff that leads to directive execution, `handoff.directive_branch` must be present and be a non empty git branch name.
- `handoff.directive_branch` must match session metadata `meta.directive_branch` when `handoff.session_id` points at a directive session.
- `handoff.worktree_mode` must be explicit for directive execution handoffs:
  - `clean_required`: execution requires clean working tree before edits.
  - `known_dirty_allowlist`: execution may proceed only when dirty paths match `worktree_allowlist_paths` exactly.
- For `clean_required`, set `handoff.worktree_allowlist_paths: []`.
- For `known_dirty_allowlist`, `handoff.worktree_allowlist_paths` must be a non empty JSON array of exact relative paths.

Rules:

- Chat handoffs are not allowed.
- Receiver must treat `<directive_slug>.handoff.json` as the sole handoff source of truth.
- `handoff.directive_branch` must match session metadata `meta.directive_branch`.
- `handoff.worktree_mode` must be present for directive execution handoffs.
- If `handoff.worktree_mode` is `known_dirty_allowlist`, `handoff.worktree_allowlist_paths` must be present and non empty.
- If `handoff.worktree_mode` is `clean_required`, `handoff.worktree_allowlist_paths` must be `[]`.
- If `<directive_slug>.handoff.json` is missing, incomplete, or mismatched, Executor must stop.

## Sender behavior

When a handoff trigger is met, sender must:

1. stop execution immediately
2. write one complete `<directive_slug>.handoff.json` artifact
3. avoid additional discretionary work after artifact write

## Receiver behavior

When a valid `<directive_slug>.handoff.json` targets receiver role:

1. treat target role as explicitly selected
2. complete required reading
3. continue execution without requesting manual role re-selection
4. use `handoff.session_id` and `handoff.task_file` to continue directly
5. verify current git branch matches `handoff.directive_branch` before any edits
6. when handoff context resolves execution target, do not request additional operator confirmation prompts before starting execution

If `<directive_slug>.handoff.json` is incomplete or malformed, receiver must stop and request correction.

## No-manual-confirmation mode

For trigger-based handoffs defined in this module, role transition should not require additional operator confirmation.

Operator may still interrupt or override at any time.

TTY transition clarification:

- Automatic handoff applies to artifact and role context (`<directive_slug>.handoff.json` and startup context), not guaranteed in-process CLI reattachment.
- If launch command is running in a non-interactive environment, sender must instruct operator to:
  1. exit current Codex session
  2. run `dc launch handoff --role <receiver> --from-role <sender> --profile <profile> --directive <session>` from a real terminal (TTY)

## Trigger matrix

1. Architect to Executor
- trigger: `architect_ultra_detected`
- condition: any non archived session with `meta.session_priority: ultra`

2. Auditor to Executor
- trigger: `auditor_ultra_open`
- condition: ultra priority enforcement task requires execution role

3. Executor to Architect
- trigger: `executor_scope_or_contract_block`
- condition: allowlist conflict, missing deterministic step detail, or unresolved deviation decision

4. Pair to Architect
- trigger: `pair_out_of_scope`
- condition: requested change exceeds `apps/web` cleanup boundary or requires backend, route, or data model decisions

5. Any role to Architect
- trigger: `role_policy_conflict`
- condition: instruction conflict cannot be resolved inside active role constraints
