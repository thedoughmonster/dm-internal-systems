> Legacy notice: This file belongs to the archived pre-runbook ruleset. It is not authoritative for current sessions. Use `.repo-agent/AGENTS.md`, `docs/repo-rules.md`, and `.runbook/instructions/*.md`.

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

- Read and enforce session `commit_policy` for reporting and lifecycle sequencing.
- `dc` does not execute git commits; agent must surface manual git checklist prompts to operator at required checkpoints.
- Do not infer commit completion from task status changes alone.
- If `commit_policy` is missing, invalid, or conflicts with task steps, stop and request clarification.

## Session metadata boundary

- Executor may only update task `meta.result` for the executed task.
- Task `meta.result` must include:
  - `summary`: one line factual outcome
  - `validation`: commands run and pass or fail outcomes, or explicit not-run reason
  - `updated`: UTC timestamp
- Executor must not manually modify task `meta.bucket` or session `<directive_slug>.meta.json` metadata.
- `dc task start` and `dc task finish` are authorized lifecycle automation for task `meta.status` and task `meta.updated`.
