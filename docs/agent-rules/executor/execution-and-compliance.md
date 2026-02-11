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

## Session metadata boundary

Executor may only update task `meta.result` for executed task.
No other directive metadata changes are allowed.
