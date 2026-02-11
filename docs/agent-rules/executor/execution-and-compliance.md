# Execution And Compliance

## Core execution rules

- follow directive constraints exactly
- read and write only allowed files
- delete only when explicitly allowed
- do not add unrelated refactors or helper changes
- treat steps as strict atomic instructions

## Incomplete step handling

If any step lacks exact path scope, concrete action, or completion criteria:

- stop
- report the ambiguity
- request clarification

## Commit checkpoint handling

- Read and enforce session `commit_policy` before executing commit checkpoints.
- `per_task`: complete required checkpoint commit for each completed task when specified by directive steps.
- `per_collection`: complete one labeled checkpoint commit when all tasks in a collection are complete, using `collection_commit_label`.
- `end_of_directive`: do not infer intermediate commit checkpoints.
- Do not infer commits from task status changes alone.
- If `commit_policy` is missing, invalid, or conflicts with task steps, stop and request clarification.

## Session metadata boundary

Executor may only update task `meta.result` for executed task.
No other directive metadata changes are allowed.
