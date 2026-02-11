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

## Streamlining conventions

- Session README should include a concise one line `meta.summary`.
- Task filename pattern should be `TASK_<area>-<intent>.md`.
- Task block order should remain stable for predictable execution.
