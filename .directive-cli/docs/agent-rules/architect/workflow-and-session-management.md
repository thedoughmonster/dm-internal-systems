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

- Intake lives in `<session_folder>/<directive_slug>.meta.json` and is non executable.
- Execution instructions live in `<session_folder>/<task_slug>.task.json`.
- Tasks must be deterministic and drift resistant.
- Steps must specify exact files, exact actions, and concrete completion artifacts.
- Tasks should be scoped to about 15 minutes of execution.

## Directive scaffolding workflow

- Architect must scaffold new session intake files and metadata pairs using repository tooling instead of manual creation.
- Primary command: `newdirective --title "<title>" --summary "<one line summary>" [--goal "<goal line>" ...]`.
- Fallback command when `newdirective` is unavailable on `PATH`: `node .directive-cli/scripts/directives/create_directive_readme.mjs --title "<title>" --summary "<one line summary>" [--goal "<goal line>" ...]`.
- Architect must scaffold task files and metadata pairs with tooling instead of manual metadata creation.
- Primary command: `newtask --session "<session-dir-or-uuid>" --title "<title>" --summary "<one line summary>"`.
- Fallback command when `newtask` is unavailable on `PATH`: `node .directive-cli/scripts/directives/create_directive_task.mjs --session "<session-dir-or-uuid>" --title "<title>" --summary "<one line summary>"`.
- Architect must create handoff artifacts with tooling instead of manual file creation.
- Primary command: `newhandoff --session "<session-dir-or-uuid>" --from-role architect --to-role executor --trigger "<id>" --objective "<one line>" --blocking-rule "<rule>"`.
- Fallback command when `newhandoff` is unavailable on `PATH`: `node .directive-cli/scripts/directives/create_handoff.mjs ...`.
- Architect metadata updates must use `architect-updatemeta` (or `node .directive-cli/scripts/directives/update_directive_metadata.mjs --role architect ...` fallback).
- Prompts are allowed when title or summary flags are omitted; resulting output must still be reviewed before task drafting.
- During `newdirective`, Architect should capture operator goals one line at a time and store them in `meta.goals`.
- Manual metadata edits are allowed only when tooling is unavailable or failing in this environment, and this exception must be noted in session notes with explicit operator authorization.

## Validation before handoff

- Validate directive JSON artifacts before finalizing task files.
- If local directive validation tooling is unavailable, stop and request operator guidance.
- Run directive metadata pair validation before handoff:
  - `node .directive-cli/scripts/directives/validate_directives_frontmatter.mjs`
- Local git hook installation command (one-time):
  - `bash .directive-cli/scripts/directives/install_git_hooks.sh`

## Session management duties

Architect responsibilities:

- Manage session state under `apps/web/.local/directives/`.
- Define and document a dedicated branch per directive before execution handoff.
- Create the directive branch (or verify it already exists) before any Executor handoff.
- Include `handoff.directive_branch` in every Architect -> Executor `<directive_slug>.handoff.json` artifact for directive execution.
- Include explicit handoff worktree policy in every Architect -> Executor execution handoff:
  - `worktree_mode: clean_required`, or
  - `worktree_mode: known_dirty_allowlist` with exact `worktree_allowlist_paths`.
- For governance-only rule edits (`.directive-cli/AGENTS.md`, `AGENTS.md`, `.directive-cli/docs/agent-rules/**`, `apps/web/docs/guides/agent-guidance.md`), create and switch to a dedicated `chore/*` branch before the first edit.
- Complete governance-only rule edits directly as Architect and create a `chore(architect):` commit when edits are complete.
- For execution handoff, create `<directive_slug>.handoff.json` in the directive session folder before any Executor work begins.
- When starting any `chore/*` directive, immediately create the `directive_branch` and switch to it before any other work.
- Reconcile task and session metadata after Executor completion using Executor-provided task `meta.result` evidence.
- Architect metadata reconciliation updates task `meta.status`, task `meta.bucket`, task `meta.updated`, and any required session `<directive_slug>.meta.json` metadata.
- Preserve original directive content after execution.
- Remove placeholder task files and placeholder session metadata todo blocks.
- Normalize metadata during handoff from user generated sessions.
- Track merge back to dev intent and current merge status in session metadata.
- Require closeout step for completed `feat/*` and `chore/*` work: switch to `dev` and delete completed branch after merge confirmation.
