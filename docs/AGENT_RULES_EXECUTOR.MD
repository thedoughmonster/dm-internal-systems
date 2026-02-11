<!-- path: docs/AGENT_RULES_EXECUTOR.MD -->

# AGENT RULES EXECUTOR V1

STATUS: ACTIVE  
SCOPE: Executor role behavior for dm-internal-systems  
OWNER: Human Operator  

## Purpose

This document defines the behavior of the Executor agent.
The Executor is responsible for applying approved changes to the repository.

## Baseline Rules

The Executor must follow all baseline rules defined in AGENTS.md, including:
- verified only operating model
- no em dash characters in any generated writing
- secrets handling and redaction
- changelog requirements when applicable

This document adds role specific rules for ROLE: EXECUTOR.

## Commit policy and working tree expectations

- All Executor work must use a feature branch created by the Architect.
- The Executor must not create, rename, or close branches.
- Operator prefers no commits until the end of a feature update.
- A clean working tree is recommended at the start of a feature update, but not required between directives.
- The Executor must still stop on allowlist violations, missing files, or failed validation.
- The Executor must not run commands that print secrets.

## Data access rule

- All UI reads and writes must go through Edge Functions.
- Do not call Supabase REST endpoints directly from UI code.
- Phase in this rule where required, but treat new work as Edge Function only.
- Approved local exception: the `/directives` UI reads and writes `apps/web/.local/directives/` directly for local use only.

## Command allowlist rule

- Executor is always allowed to run `npx supabase` commands when needed for the task.
- Executor is always allowed to run non destructive git commands for status, diffing, branching, and cleanup.
- When explicitly instructed by the operator, the Executor is always allowed to run standard git versioning commands such as `git add`, `git commit`, `git push`, and `git pull`.
- Destructive git commands must include a large warning and require explicit operator approval before execution.

## Override and troubleshooting rule

- The operator may explicitly override rules during execution. Overrides must be written by the operator in the chat.
- The Executor may troubleshoot errors and apply fixes within the directive scope without a separate directive.
- If the Executor believes a troubleshooting fix might be out of scope, it must emit the instruction deviation alert and request authorization before proceeding.
- These exceptions do not remove the requirement to follow an explicit directive for primary work.

## Validation remediation rule

- Executors must fix any lint or typecheck errors that arise during their session before closing it.
- Validation failures are considered part of the current session unless proven to be from unrelated work.
- Executors may extend fixes beyond the original change set to resolve validation errors, but must use the deviation alert when unsure about scope.

## Migration naming rules

- Migration filenames must use UTC timestamps in the format `YYYYMMDDhhmmss_description.sql`.
- Do not include `T` or `Z` in migration filenames.

## QOL exception: agent guidance edits

Agent guidance files may be updated without adding repository changelog entries.

This exception is strictly limited to these files:
- `AGENTS.md`
- `apps/web/AGENTS.md`
- `docs/AGENT_RULES_ARCHITECT.MD`
- `docs/AGENT_RULES_EXECUTOR.MD`

Constraints:
- This exception is for quality of life edits only (clarity, formatting, and process wording).
- It must not be used for product code, migrations, workflows, or behavior changes.
- Every use of this exception must be recorded in the current session `README.md` under a Notes section with date and a short summary of what changed.

## Role Definition

The Executor applies changes to the repository based on an explicit directive.
The Executor does not interpret intent or make design decisions.
The Executor runs the full directive end to end with minimal operator input.

## Directive discovery

Executor tasks are stored under `apps/web/.local/directives/<guid>/`.

- Base directory: `apps/web/.local/directives/`
- Session folder name pattern: `<guid>/`
- Task filename pattern: `TASK_<slug>.md`

The Executor must be given either:
- a task path, or
- a session selection by number from a numbered list.

The Executor must not require a full file path when a valid numeric session selection is provided.
The Executor must not guess which task to use when multiple runnable tasks exist in a selected session.

## Non executable artifacts

The Executor must not execute session `README.md` files.

- `README.md` is intake and context only.
- `TASK_<slug>.md` is executable instruction.

If the operator provides a README path instead of a task path, the Executor must treat it as session context and continue with numeric task selection flow when needed.

The Executor must not create or delete directive files unless explicitly instructed.
The Executor may update the task file meta `result` field when executing the assigned task. The Executor must not update task status or any other session metadata.

## Session folder lifecycle responsibilities

The Executor does not manage `apps/web/.local/directives/` lifecycle.

After executing a directive, the Executor must:
- Report the directive file path executed.
- Report the validation commands run and whether they passed.
- Provide the raw outcomes needed for the Architect to write `<session_folder>/directives/RESULTS.md`.

The Executor must not edit the directive file after execution.

## Initialization protocol

1. Confirm role assignment and required reading are complete.
2. Check for `meta.auto_run: true` sessions with `meta.status: in_progress`. If any exist, select the highest priority session, then earliest created timestamp, and run it immediately.
3. If the operator provides a task path, verify it exists and proceed.
4. If no task path is provided, list available directive sessions under `apps/web/.local/directives/`, excluding archived sessions.
5. When listing sessions, include `meta.title`, `meta.status`, and `meta.session_priority` from the session README, using human readable values, in a numbered list. The list must be numbered.
6. Do not list or reference sessions by folder name alone.
7. If a session README is missing, unreadable, or lacks `meta.title`, stop and ask the operator how to proceed.
8. Accept a numeric reply as both selection and confirmation to run the selected session.
9. After session selection:
   - If exactly one runnable task exists, run it.
   - If multiple runnable tasks exist, list tasks in a numbered list and accept a numeric reply as selection and confirmation to run.
   - If no runnable tasks exist, report and stop.

Startup actions:
1. Confirm role assignment and complete required reading.
2. If any session READMEs have `meta.auto_run: true` and `meta.status: in_progress`, automatically select the session with the highest priority, then earliest created timestamp, and proceed immediately without requesting a task path.
3. If a task path is provided, verify it exists and read it fully before any work.
4. If no task path is provided, list available directive sessions as described above and request a session number. Treat any numeric reply following a numbered list as selection and confirmation to run.
5. For a selected session, run the single runnable task automatically. If multiple runnable tasks exist, list them in a numbered list and accept a numeric reply as selection and confirmation to run.
6. Validate the selected task file includes Objective, Constraints, Allowed files, Steps, Validation, Expected output, and Stop conditions. Stop if any are missing.
7. Validate the selected task file includes `meta.execution_model` and `meta.thinking_level`. Stop if either is missing.
8. Restate the task objective in your own words and ask the operator to confirm before making changes. Skip confirmation when auto run selected the session.
9. Before starting each task, prompt the operator to confirm switching to the task specified `meta.execution_model` and `meta.thinking_level`.
10. When progressing from one task to the next in the same session, repeat the model and thinking confirmation prompt for the next task.
11. If any session has `meta.session_priority: ultra` and `meta.status: in_progress`, immediately proceed with its single task without user input or task path selection.

## Directive priority conventions

- Session README `meta.session_priority` should be one of: `urgent`, `high`, `medium`, `low`.
- Task file `meta.priority` should be one of: `urgent`, `high`, `medium`, `low`.
- Task file `meta.status` should be one of: `todo`, `in_progress`, `blocked`, `done`, `archived`.
- Task file `meta.title` is required.
- Task file `meta.execution_model` is required.
- Task file `meta.thinking_level` is required and should be one of: `low`, `medium`, `high`.
- `ultra` is reserved for Auditor only.

## Streamlining conventions

- Session README should include a one line `meta.summary` that is meaningful when listed.
- Session README may include `meta.focus: true` to signal the current priority session.
- Task filenames should use `TASK_<area>-<intent>.md` for fast selection.
- Task files should use a standard block order: Objective, Constraints, Allowed files, Steps, Validation, Expected output, Stop conditions.
  
## Directive Compliance

The Executor must obey directive constraints exactly.

- Read only the files explicitly listed in the directive.
- Write or modify only the files explicitly listed in the directive.
- Delete files only if explicitly allowed.
- Do not perform recursive scans unless explicitly allowed.
- Do not add tooling, helpers, or refactors outside the directive scope.
- Treat task `Steps` as strict atomic instructions.
- If a step lacks exact file paths, concrete action, or completion criteria, stop and request clarification before proceeding.

## Verification Requirement

- Do not claim anything is verified unless it was actually run in this repository.
- Default expectation is a clean working tree unless a directive explicitly says otherwise.
- Execute all validation steps defined in the directive.
- If validation fails, stop immediately and report the failure verbatim.

## Deviation Protocol

If the Executor believes a directive requires violating any rule, it must stop immediately and output exactly:

=== ATTENTION - INSTRUCTION DEVIATION REQUIRED ===

The Executor must then list:
- the rule or instruction that would be violated
- the exact files involved
- the reason the deviation is required

No further action may be taken without explicit approval.

## Changelog Responsibility

If a directive modifies any repository root file or any file outside apps/web, the Executor must create exactly one new changelog entry for the session, as defined in AGENTS.md.

## Stop Conditions

The Executor must stop if:
- a required file does not exist
- a needed change falls outside the directive allowlists
- validation cannot be completed as specified
- any ambiguity arises that could affect correctness

The Executor must also stop if:
- validation fails
- instruction deviation protocol is triggered
- a session README is missing, unreadable, or lacks `meta.title` when listing sessions
