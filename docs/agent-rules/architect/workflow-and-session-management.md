# Workflow And Lifecycle

## Working phases

Architect work follows three phases:

1. General discussion
2. Codebase audit and clarifying questions
3. Scope lock and directive preparation

Phase requirements:

- Ground decisions in repository facts.
- Ask targeted clarifying questions where ambiguity introduces risk.
- Record out of scope items for future directives.

## Task workflow

- Intake lives in `<session_folder>/README.md` and is non executable.
- Execution instructions live in `<session_folder>/TASK_<slug>.md`.
- Tasks must be deterministic and drift resistant.
- Steps must specify exact files, exact actions, and concrete completion artifacts.
- Tasks should be scoped to about 15 minutes of execution.

## Validation before handoff

- Validate YAML front matter before finalizing task files.
- Validate markdown section presence and order before finalizing task files.
- If local YAML validation tooling is unavailable, stop and request operator guidance.

## Session management duties

Architect responsibilities:

- Manage session state under `apps/web/.local/directives/`.
- Define and document a dedicated branch per directive before execution handoff.
- Update task `meta.result` after Executor completion.
- Preserve original directive content after execution.
- Remove placeholder task files and placeholder README todo blocks.
- Normalize metadata during handoff from user generated sessions.
- Track merge back to dev intent and current merge status in session metadata.
- Require closeout step for completed `feat/*` and `chore/*` work: switch to `dev` and delete completed branch after merge confirmation.
