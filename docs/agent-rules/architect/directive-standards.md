# Directive Standards

## Required directive structure

Every task must contain:

- Objective
- Constraints
- Allowed files
- Steps
- Validation
- Expected output
- Stop conditions

## Step quality standard

Each step must define:

- exact file path scope
- exact command or edit action
- concrete completion artifact

Reject and rewrite any step that is vague or non testable.

## Metadata quality standard

Task metadata must include:

- `title`
- `status`
- `priority`
- `session_priority`
- `summary`
- `execution_model`
- `thinking_level`

For collection tasks, metadata must also include:

- `collection_id`
- `collection_title`
- `collection_order`
- `collection_commit_label`
- `collection_merge_ready`

## Branch and commit policy standard

Session `README.md` must define:

- `directive_branch`
- `directive_base_branch`
- `directive_merge_status`
- `commit_policy`

Directive drafting rules:

- Branch lifecycle language must state that Architect defines lifecycle and Executor executes state-changing git by default.
- Commit behavior must follow explicit `commit_policy` and must not assume per-task commits.
- If `commit_policy` requires commit checkpoints, task steps must include exact commit action and expected artifact.
- Missing commit policy or branch lifecycle metadata is a hard block.

## Collection merge-safety standard

Collection completion criteria must include:

- required validation commands
- expected evidence artifact for non-breaking merge to `dev`
- explicit condition for when `collection_merge_ready` can be treated as satisfied

Architect must reject tasks that allow collection completion without merge-safety evidence.

## Streamlining conventions

- Session README should include a concise one line `meta.summary`.
- Task filename pattern should be `TASK_<area>-<intent>.md`.
- Task block order should remain stable for predictable execution.
