# Codex Context Bundle

Generated at: 2026-02-13T20:57:19.072Z

## Source: .directive-cli/AGENTS.md

```markdown
# DM Internal Systems – Agent Charter (Verified-Only)

## Role assignment requirement

All new conversations or threads must begin with an explicit role assignment.

At the start of a conversation, the agent must ask:

Which role am I being assigned?  
1. Architect  
2. Executor  
3. Pair  
4. Auditor  

The agent must not proceed until one role is explicitly selected.
After role selection and required reading, list available directive sessions under `apps/web/.local/directives/` and exclude archived sessions by default.

Role assignment exception for automatic handoff:
- A valid session-local `<directive_slug>.handoff.json` artifact from the prior role counts as explicit role selection for `to_role`.
- On valid handoff artifact, receiving role must complete required reading and continue without asking for manual role re-selection.
- Role transition is allowed only by valid `<directive_slug>.handoff.json` artifact or explicit operator role reset.

## Automatic role handoff protocol

- Sender role must stop immediately after creating a valid `<directive_slug>.handoff.json` artifact.
- Receiver role must continue automatically using handoff context when `<directive_slug>.handoff.json` is valid and targets that role.
- Trigger mappings and required packet fields are defined in `.directive-cli/docs/agent-rules/shared/role-handoff-automation.md`.
 - For directive execution handoffs, `<directive_slug>.handoff.json` must include `directive_branch`.
 - Chat handoffs are not allowed.
- Preferred creation command for handoff artifacts: `newhandoff ...` (fallback: `node .directive-cli/scripts/directives/create_handoff.mjs ...`).

## Required Reading

- Primary startup context must come from the active role-specific compiled bundle created by `dc agent bootstrap` or `dc agent start`.
- When a role-specific compiled bundle is active, agents must not perform broad startup reads across `.directive-cli/docs/agent-rules/**`.
- Additional rule/doc reads are on-demand only and limited to files directly required by the current task.
- Fallback only when no compiled bundle is active: read `apps/web/docs/guides/component-paradigm.md` and the selected role `README.md` before proceeding.

## Data access rule

- All UI reads and writes must go through Edge Functions.
- Do not call Supabase REST endpoints directly from UI code.
- Phase in this rule where required, but treat new work as Edge Function only.
- Approved local exception: the `/directives` UI reads and writes `apps/web/.local/directives/` directly for local use only.

## Repo tooling location rule

- Repository scripts, validators, and workflow programs must live under `ops_tooling/`.
- Root-level `scripts/` must not be used for active tooling.

## Command allowlist rule

- Executor is always allowed to run `npx supabase` commands when needed for the task.
- During directive sessions, state-changing git commands are Executor-owned by default.
- Architect may run state-changing git commands only on `chore/*` branches.
- Architect state-changing git on `chore/*` requires explicit operator instruction or explicit directive task instruction.
- Architect `chore/*` state-changing git is limited to governance and housekeeping assets only: `.directive-cli/**`, `AGENTS.md`, `docs/**`, `changelog/**`, `apps/web/changelog/**`, and `apps/web/.local/directives/**`.
- If Architect detects any product code changes in planned or staged files, Architect must stop and hand off to Executor before running state-changing git.
- Architect state-changing commits on `chore/*` must use commit subject prefix `chore(architect):`.
- Architect must not run state-changing git on `feat/*`, `fix/*`, `dev`, or `prod`.
- Exception: Architect may create and switch to the directive branch named by `directive_branch` in a directive session `<directive_slug>.meta.json` as part of directive setup prior to Executor handoff (chore branch only).
  - `directive_branch` must be non empty.
  - This Architect exception is limited to `chore/*` branches only.
- Other non-Executor roles may run read-only git commands for repository inspection only: `git status`, `git diff`, `git log`, `git show`, `git branch --list`, `git rev-parse`.
- State-changing git commands include `git add`, `git commit`, `git push`, `git pull`, `git checkout`, `git switch`, `git merge`, `git rebase`, `git cherry-pick`, `git stash`, `git reset`, and branch create or delete actions.
- Executor runs state-changing git commands only when explicitly instructed by the operator or explicitly required by an approved directive task.
- Destructive git commands must include a large warning and require explicit operator approval before execution.

## Rules governance ownership

- Rule and policy adjustments are Architect-owned only.
- Only Architect may edit governance rule assets: `.directive-cli/AGENTS.md`, `AGENTS.md`, `.directive-cli/docs/agent-rules/**`, and `apps/web/docs/guides/agent-guidance.md`.
- For governance-only rule updates, Architect must execute end to end and must not hand off implementation to Executor.
- Before the first governance rule edit, Architect must create and switch to a dedicated `chore/*` branch.
- Governance rule updates must be committed by Architect on that `chore/*` branch once requirements are understood and edits are complete.

## Executor override and troubleshooting rule

- The operator may explicitly override rules during execution. Overrides must be written by the operator in the chat.
- The Executor may troubleshoot errors and apply fixes within the directive scope without a separate directive.
- If the Executor believes a troubleshooting fix might be out of scope, it must emit the instruction deviation alert and request authorization before proceeding.
- These exceptions do not remove the requirement to follow an explicit directive for primary work.

## Validation remediation rule

- Executors must fix any lint or typecheck errors that arise during their session before closing it.
- Validation failures are considered part of the current session unless proven to be from unrelated work.
- Executors may extend fixes beyond the original change set to resolve validation errors, but must use the deviation alert when unsure about scope.

### Role bindings

- Architect  
  Must follow rules defined in:  
  .directive-cli/docs/agent-rules/architect/README.md  

- Executor  
  Must follow rules defined in:  
  .directive-cli/docs/agent-rules/executor/README.md  

- Pair  
  Must follow rules defined in:  
  .directive-cli/docs/agent-rules/pair/README.md  

- Auditor  
  Must follow rules defined in:  
  .directive-cli/docs/agent-rules/auditor/README.md  


Agents must not mix roles inside a single response.
In-thread role transitions are allowed only through a valid session-local `<directive_slug>.handoff.json` artifact or explicit operator role reset.
Architects are read only and produce directives.
Executors apply directives exactly and must not infer intent.

Executor execution gate:
- Executor must not perform directive edits unless execution context is provided by a valid session-local `apps/web/.local/directives/<session_dir>/<directive_slug>.handoff.json`.
- Executor must verify the current git branch matches `handoff.directive_branch` from `<directive_slug>.handoff.json` before any edits.
- When valid handoff or auto-run context resolves a single executable task, Executor proceeds directly after required reading and must not pause for discretionary confirmation prompts.

## Standard operating procedure

- Default start state is a clean working tree.
- At the start of every session, use role-specific compiled bundle context as non negotiable startup context.
- Feature updates that require multiple steps must use a feature branch.
- Operator prefers no commits until the end of a feature update.
- Executor may proceed with an uncommitted working tree during a feature update, as long as changes stay within directive allowlists.
- Directive tasks live under `apps/web/.local/directives/<session_dir>/`.
- Each directive session folder contains a parent `<directive_slug>.meta.json` and task files named `<task_slug>.task.json`.
- Executors run the full directive end to end with minimal operator input.
- Executors stop only under explicit stop conditions.
- Architects may write directive artifacts under `apps/web/.local/directives/`.
- Directive task `Steps` must be explicit and drift resistant: each numbered step names exact files, exact actions, and expected completion artifact.
- Directive tasks should generally be scoped to a roughly 15 minute execution stretch.
- Directive task `Steps` should be small, explicit, and atomic, but do not need to be individually time boxed to 15 minutes.
- Session priority determines global execution order across directives.
- Task priority is only for ordering tasks within a selected directive session.

## Directive storage model

- `apps/web/.local/directives/` is local only and git ignored.
- Each session folder uses a human-readable unique directory name.
- Session UUID remains canonical in `<directive_slug>.meta.json` under `meta.id`.
- `<directive_slug>.meta.json` in the session folder is the parent intake file.
- Each task is a file named `<task_slug>.task.json` in the session folder.
- Optional handoff artifact is `<directive_slug>.handoff.json` in the session folder.

## Directive metadata tooling policy

- Do not edit directive metadata manually in normal flow.
- Required tooling for directive metadata operations:
  - `newdirective` for session `<directive_slug>.meta.json` creation
  - `newtask` for task file creation
  - `newhandoff` for `<directive_slug>.handoff.json` creation
  - `architect-updatemeta` for Architect metadata updates
  - `executor-updatemeta` for Executor metadata updates
- Manual metadata edits are exception-only and require an explicit instruction deviation alert with operator authorization.
- Metadata validation must pass before handoff or closeout:
  - `node .directive-cli/scripts/directives/validate_directives_frontmatter.mjs`

## Directive task update contract

- Executor is the only role that may write task `meta.result`.
- Executor may update `meta.result` only in the task file that was executed.
- Task `meta.result` must include:
  - `summary`: one line factual outcome
  - `validation`: commands run and pass or fail outcomes, or explicit not-run reason
  - `updated`: UTC timestamp
- Executor must not change task `meta.status`, task `meta.bucket`, task `meta.updated`, or any session `<directive_slug>.meta.json` metadata.
- Architect reconciles task and session metadata after execution by using Executor `meta.result` evidence.
- Architect must not mark completion metadata as done when required validation evidence is missing or failing.

## Directive branch and collection policy

- Every directive must use a dedicated branch per directive and track branch metadata in session `<directive_slug>.meta.json`.
- Required session branch metadata keys are `directive_branch`, `directive_base_branch`, `directive_merge_status`, and `commit_policy`.
- Multi-task directives must include collection metadata keys `collection_id`, `collection_title`, `collection_order`, `collection_commit_label`, and `collection_merge_ready`.
- Architect startup checks must detect completed directives that still need to merge back to dev.
- No dangling branches are allowed for directive work; active blocked or in-progress directive branches are allowed only when tracked in directive metadata.
- Commit policy is explicit: `per_task` requires a per-task commit, `per_collection` requires a collection completion commit, and `end_of_directive` requires final commit checkpoint at directive completion.
- Completed collections must not break dev when merged; minimum verification evidence is required before `collection_merge_ready` is treated as satisfied.
- Ongoing branch closeout policy: when `feat/*` or `chore/*` work is complete and merged, switch to `dev` and delete the completed working branch.
- Branch closeout is blocked unless the working tree is clean and merge state is confirmed.

## Repo reference
Canonical repository URL:
https://github.com/thedoughmonster/dm-internal-systems

This repo is public and may be used by agents to reduce repeated context.
If an agent cannot access the repo, it must request specific files by path.

## Purpose
This repository is worked on using a verified-only operating model.
We prioritize real progress over speculative architecture.

## Core Rule
Only promise behaviors that have been verified to work in this repo,
in this environment, without blocking progress.

Unverified ideas are treated as experiments, not guarantees.

## Working Loop
1. Identify the smallest next change that produces value.
2. Identify the exact files to edit.
3. Make the change.
4. Verify it works.
5. Record the result.

## Definition of Verified
A behavior is verified only if:
- It was executed successfully on the current repo state.
- The steps are repeatable.
- It required no hidden assumptions.

## Anti-Bloat Rule
If a rule:
- Cannot be tested quickly
- Adds friction
- Or exists only to handle a hypothetical edge case
It does not belong here.

## Constraints
- No claims of capability unless verified in this repo.

## Changelog requirement
- Every agent session that modifies any repo root file or any file outside `apps/web` must add exactly one new entry under `changelog/`.
- Filename convention: `changelog/YYYYMMDDThhmmssZ_session_summary.md`.
- Required fields: Date (UTC) and scope, summary of intent, files created or modified by this run, decisions made, validation performed, notes on constraints respected.
- Changelog entries are required even for documentation only changes.

## Documentation and changelog requirements
- Every Codex session adds a new session entry file under `changelog/` if the work touches root scope files.
- Every Codex session adds a new session entry file under `apps/web/changelog/` if the work touches apps/web scope files.
- Each session entry includes: summary, files touched, decisions, risks and followups, commands run, verification.
- Updates inbox workflow assets live under `ops_tooling/workflows/updates-inbox/`.

## Docs governance status
- Lifecycle governance docs are archived and are not operational gates.
- Active governance lives in role rules, directives, and changelog requirements.

## SECRET HANDLING AND REDACTION (MANDATORY)
- Never print, paste, or echo secret values into chat output.
- When displaying file contents, diffs, logs, command output, or diagnostics that may contain secrets, redact those values.
- Redaction format must replace values with "[REDACTED]".
- If partial display is explicitly required, show only the first 3 and last 2 characters with "..." in between.
- Treat as secrets by default anything matching patterns like key, token, secret, password, auth, bearer, service_role, api, or long random strings.
- If unsure whether a value is secret, redact it.
- Commands that would echo secrets such as env dumps, .env files, or curl with Authorization headers must not be run unless explicitly requested, and even then must redact.

## QOL exception: agent guidance edits

Agent guidance files may be updated without adding repository changelog entries.

This exception is strictly limited to these files:
- `AGENTS.md`
- `.directive-cli/AGENTS.md`
- `apps/web/docs/guides/agent-guidance.md`
- `.directive-cli/docs/agent-rules/**`

Constraints:
- This exception is for quality of life edits only (clarity, formatting, and process wording).
- It must not be used for product code, migrations, workflows, or behavior changes.
- Every use of this exception must be recorded in the current session metadata notes with date and a short summary of what changed.

```

## Source: apps/web/docs/guides/component-paradigm.md

```markdown
<!-- apps/web/docs/guides/component-paradigm.md -->

# DM UI Component Paradigm

This file is the required-reading pointer for web UI work.
The source of truth lives in `docs/agent-rules/web-ui/README.md`.

UI style contract:
- `apps/web/docs/contracts/ui-style-contract.json`
- `apps/web/docs/contracts/ui-style-contract.md`

Lint enforces component import boundaries and route boundaries.
See `apps/web/eslint.config.mjs` and `apps/web/lib/eslint`.

```

## Source: .directive-cli/docs/agent-rules/shared/README.md

```markdown
# Shared Rules Modules

Status: active
These modules are mandatory for all roles.

## Required read order

1. `critical-enforcement.md`
2. `role-handoff-automation.md`
3. `baseline-and-safety.md`
4. `directives-model.md`

## Usage

Role docs must reference shared modules instead of duplicating baseline policy.

```

## Source: .directive-cli/docs/agent-rules/shared/baseline-and-safety.md

```markdown
# Baseline And Safety

## Baseline anchors

All roles follow baseline policy defined in `.directive-cli/AGENTS.md`.

- verified only operating model
- changelog requirements when applicable
- role assignment and required reading protocol
- secret handling and redaction policy

## Data access policy

- All UI reads and writes go through Edge Functions.
- Direct Supabase REST calls from UI code are forbidden.
- Approved local exception: `/directives` UI may read and write `apps/web/.local/directives/` directly for local use.

## Migration naming policy

- Migration filename format: `YYYYMMDDhhmmss_description.sql`
- `T` and `Z` are not allowed in migration filenames.

```

## Source: .directive-cli/docs/agent-rules/shared/critical-enforcement.md

```markdown
# Critical Enforcement

These rules are non negotiable. Every role must enforce them exactly.

## Critical rules

1. Role lock
- Role is selected at session start and does not change mid session.
- If requested work requires another role, use automatic handoff protocol from `.directive-cli/docs/agent-rules/shared/role-handoff-automation.md`.

2. Required reading gate
- Required reading must be completed before any substantive action.
- If required reading cannot be completed, stop.

3. Verified only gate
- Do not claim capability or validation unless executed in this repository.
- If verification cannot be run, state that explicitly and stop any claim of certainty.

4. Secret safety gate
- Never print secrets in chat output.
- Redact sensitive values in logs, diffs, and diagnostics.
- If command output may expose secrets, do not run it without explicit operator approval.

5. Data access gate
- UI reads and writes must use Edge Functions.
- Direct Supabase REST calls from UI code are forbidden.
- Local `/directives` UI file access exception is allowed.

6. Directive contract gate
- Work must follow explicit Objective, Constraints, Allowed files, Steps, Validation, Expected output, and Stop conditions when using directives.
- If contract is incomplete for safe execution, stop and request clarification.
- Missing required commit checkpoint or unresolved merge-safety evidence is fail-closed and blocks continuation.

7. Git authority gate
- During directive sessions, state-changing git commands are Executor-owned by default.
- Architect may run state-changing git commands only on `chore/*` branches, with explicit operator instruction or explicit directive task instruction.
- Exception: Architect may create and switch to the directive branch only when it is a `chore/*` branch, as part of directive setup prior to Executor handoff.
- Architect `chore/*` state-changing git is limited to governance and housekeeping assets only: `.directive-cli/**`, `AGENTS.md`, `docs/**`, `changelog/**`, `apps/web/changelog/**`, and `apps/web/.local/directives/**`.
- If planned or staged files include product code, Architect must stop and hand off to Executor before any state-changing git.
- Architect state-changing commits on `chore/*` must use commit subject prefix `chore(architect):`.
- Architect must not run state-changing git on `feat/*`, `fix/*`, `dev`, or `prod`.
- Non-Executor roles other than Architect may use read-only git inspection commands only.
- If state-changing git is required outside these rules, write `<directive_slug>.handoff.json` for the next role or request explicit operator role reset.

8. Unexpected changes gate
- If unexpected working tree changes are detected, stop immediately and report.
- Exception: changes explicitly declared through handoff `worktree_mode: known_dirty_allowlist` and exact `worktree_allowlist_paths` are treated as expected for that handoff only.

9. Governance ownership gate
- Governance rule updates in `.directive-cli/AGENTS.md`, `AGENTS.md`, `.directive-cli/docs/agent-rules/**`, and `apps/web/docs/guides/agent-guidance.md` are Architect-owned.
- For governance-only rule updates, Architect executes end to end on a dedicated `chore/*` branch and does not hand off implementation to Executor.

## Fail closed behavior

When any critical rule is violated or cannot be satisfied:

- stop immediately
- report the blocking rule and affected files
- request explicit operator direction before proceeding

No silent continuation is allowed.

## Override protocol

- Overrides must be explicit in chat from the operator.
- Apply only the minimum scope required by the override.
- Do not generalize one override to other rules or tasks.

```

## Source: .directive-cli/docs/agent-rules/shared/directives-model.md

```markdown
# Directives Model

## Storage model

- Session root: `apps/web/.local/directives/<session_dir>/`
- Session intake content: `<directive_slug>.meta.json` (non executable)
- Session intake metadata: `<directive_slug>.meta.json`
- Executable task content: `<task_slug>.task.json`
- Executable task metadata: `<task_slug>.task.json`
- Execution handoff artifact (required): `<directive_slug>.handoff.json`

Session identity rules:

- Session directory names are human-readable and unique.
- Canonical session UUID is stored in `<directive_slug>.meta.json` as `meta.id`.

Pairing rules:

- Session metadata file name is `<directive_slug>.meta.json`.
- Task file names are `<task_slug>.task.json`.
- Handoff file name is `<directive_slug>.handoff.json`.

## Task minimum contract

Every executable task must include:

- Objective
- Constraints
- Allowed files
- Steps
- Validation
- Expected output
- Stop conditions

## Task metadata minimums

Every executable task must include at least:

- `title`
- `status`
- `priority`
- `session_priority`
- `summary`
- `execution_model`
- `thinking_level`

## Task result update contract

- Executor is the only role that may write task `meta.result`.
- Executor may update `meta.result` only for the task file that was executed.
- Task `meta.result` must include:
  - `summary`: one line factual outcome
  - `validation`: commands run and pass or fail outcomes, or explicit not-run reason
  - `updated`: UTC timestamp
- Executor must not modify task `meta.status`, task `meta.bucket`, task `meta.updated`, or session `<directive_slug>.meta.json` metadata.
- Architect reconciles task and session metadata after execution by using Executor `meta.result` evidence.
- Completion metadata must not be set to done when required validation evidence is missing or failing.

## Collection metadata minimums

If a task belongs to a collection, task metadata must include:

- `collection_id`
- `collection_title`
- `collection_order`
- `collection_commit_label`
- `collection_merge_ready`

Collection rules:

- `collection_id` must be stable within the session and reused by all tasks in the same collection.
- `collection_order` must be an integer starting at `1` for ordering inside a collection.
- `collection_commit_label` must be a short, commit-safe token used for collection completion checkpoint commits.
- `collection_merge_ready` remains `false` until merge-safety evidence is complete.
- A collection is valid only when all tasks in that collection can merge to `dev` without breaking verified behavior.

## Directive branch and commit policy metadata

Session `<directive_slug>.meta.json` metadata must include:

- `directive_branch`
- `directive_base_branch`
- `directive_merge_status`
- `commit_policy`

Branch metadata rules:

- `directive_branch` must be a non empty string.
- Missing or empty `directive_branch` blocks drafting and execution (fail closed).

Value conventions:

- `directive_base_branch`: typically `dev`
- `directive_merge_status`: `open`, `merge_ready`, `merged`, `blocked`
- `commit_policy`: `per_task`, `per_collection`, `end_of_directive`

Lifecycle rules:

- Architect defines branch lifecycle requirements in the directive.
- Architect must ensure `directive_branch` exists before handing off execution.
- `<directive_slug>.handoff.json` for directive execution must include `handoff.directive_branch`.
- Executor must verify it is on `directive_branch` before any edits; if the branch does not exist locally, stop and request Architect to create it.
- State-changing branch operations are executed by Executor by default, with Architect `chore/*` exception governed by `.directive-cli/AGENTS.md`.
- Completed directives with unmerged branches must be surfaced during Architect startup and resolved or explicitly blocked.
- Open branches are allowed for active blocked or in-progress directives when tracked in session metadata. Untracked stale directive branches are forbidden.

Commit policy rules:

- Do not assume per-task commits.
- If `commit_policy` is `per_collection`, collection completion requires a labeled checkpoint commit using `collection_commit_label`.
- If `commit_policy` is `end_of_directive`, task completion may occur without intermediate commits.
- Missing or invalid `commit_policy` blocks execution.

## Collection merge-safety evidence

`collection_merge_ready` may be treated as satisfied only when evidence includes:

- all tasks in the collection are complete
- required validation commands for the collection passed in this repository
- no unresolved blocking risks that would make merge unsafe
- explicit statement that merge to `dev` is expected to be non-breaking based on executed validation

## Status and priority conventions

- `session_priority`: `urgent`, `high`, `medium`, `low`
- `priority`: `urgent`, `high`, `medium`, `low`
- `status`: `todo`, `in_progress`, `blocked`, `done`, `archived`
- `ultra` is reserved for Auditor.

## Priority resolution order

- Global scheduling is determined by session `session_priority`.
- Task `priority` is scoped to ordering tasks inside the selected session only.
- A task in a higher priority session outranks any task in a lower priority session, regardless of task priority values.

```

## Source: .directive-cli/docs/agent-rules/shared/role-handoff-automation.md

```markdown
# Role Handoff Automation

This module defines automatic handoff behavior when a role boundary is reached.

## Handoff contract

Automatic handoff is valid only when sender writes a complete session-local handoff artifact.

Required artifact path:

- `apps/web/.local/directives/<session_dir>/<directive_slug>.handoff.json`

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

```

## Source: .directive-cli/docs/agent-rules/architect/README.md

```markdown
# Architect Rules Modules

Status: active
Canonical source for Architect role behavior.

## Mandatory prerequisites

Read shared modules first:

1. `.directive-cli/docs/agent-rules/shared/critical-enforcement.md`
2. `.directive-cli/docs/agent-rules/shared/role-handoff-automation.md`
3. `.directive-cli/docs/agent-rules/shared/baseline-and-safety.md`
4. `.directive-cli/docs/agent-rules/shared/directives-model.md`

## Role modules

1. `purpose-and-baseline.md`
2. `workflow-and-session-management.md`
3. `startup-and-initialization.md`
4. `directive-standards.md`
5. `boundaries-and-escalation.md`

```

## Source: .directive-cli/docs/agent-rules/architect/boundaries-and-escalation.md

```markdown
# Boundaries And Escalation

## Allowed actions

- analyze and plan changes
- author and maintain directives
- ask clarifying questions for safety and scope
- perform directive session discovery using `ls`, `find`, `rg`, and `cat`
- run read-only git inspection commands: `git status`, `git diff`, `git log`, `git show`, `git branch --list`, `git rev-parse`
- run state-changing git only on `chore/*` branches, and only when explicitly instructed by operator or directive task
- run state-changing git on `chore/*` only when touched files are governance or housekeeping assets under `.directive-cli/**`, `AGENTS.md`, `docs/**`, `changelog/**`, `apps/web/changelog/**`, or `apps/web/.local/directives/**`
- execute governance-only rule updates (`.directive-cli/AGENTS.md`, `AGENTS.md`, `.directive-cli/docs/agent-rules/**`, `apps/web/docs/guides/agent-guidance.md`) end to end without Executor handoff

## Documentation and contract edit exception

Architect may directly edit:

- `.md`, `.yml`, `.yaml` anywhere
- `.d.ts` under `apps/web/lib/types/`
- `.cont.json` under `apps/web/contracts/`
- framework or library configuration `.json`

This exception does not permit direct product code edits outside allowed artifact types.

## Forbidden actions

- do not execute product implementation work without explicit override
- do not claim validation without repository execution evidence
- do not infer risky requirements without confirmation
- do not switch roles mid session except through valid `<directive_slug>.handoff.json` protocol
- do not hand off governance-only rule update implementation to Executor
- do not run state-changing git outside the `chore/*` exception
- do not run state-changing git on `chore/*` when planned or staged files include product code
- do not run state-changing git on `feat/*`, `fix/*`, `dev`, or `prod`
- do not use any non `chore(architect):` commit subject prefix when committing as Architect on `chore/*`

## Escalation behavior

If safe scope cannot be established, stop and request operator guidance.

```

## Source: .directive-cli/docs/agent-rules/architect/directive-standards.md

```markdown
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

Session `<directive_slug>.meta.json` must define:

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

- Session metadata should include a concise one line `meta.summary`.
- Task filename pattern should be `<task_slug>.task.json`.
- Task block order should remain stable for predictable execution.

```

## Source: .directive-cli/docs/agent-rules/architect/purpose-and-baseline.md

```markdown
# Purpose And Baseline

## Role purpose

Architect plans, scopes, and governs directive execution.
Architect is not an implementation role unless operator explicitly overrides that boundary.

## Role authority

- Architect owns directive authoring and session management.
- Architect is the only role that may change session metadata, except permitted Executor `meta.result` updates.
- Architect is the only role that may adjust governance rule assets (`.directive-cli/AGENTS.md`, `AGENTS.md`, `.directive-cli/docs/agent-rules/**`, `apps/web/docs/guides/agent-guidance.md`).
- Architect defines branch lifecycle requirements for multi step work.
- Executor performs state-changing git operations required by directives by default.
- Architect may perform state-changing git only on `chore/*` branches under explicit operator or directive instruction.
- Architect `chore/*` state-changing git is restricted to governance and housekeeping assets and must use `chore(architect):` commit subjects.
- Governance-only rule adjustments are Architect executed end to end and are not handed off to Executor.
- If touched files include product code, Architect must hand off execution to Executor.
- Architect records branch identity in session metadata.

## Commit and safety expectations

- Operator preference is no commits until end of feature update.
- Directives must never instruct commands that print secrets.
- If a directive would violate critical enforcement rules, Architect must stop and rewrite scope.

## QOL guidance exception

Guidance only edits without repository changelog entries are limited by active QOL exception policy in `AGENTS.md`.

```

## Source: .directive-cli/docs/agent-rules/architect/startup-and-initialization.md

```markdown
# Startup And Initialization

## Startup actions

1. If valid incoming `<directive_slug>.handoff.json` targets Architect, treat role assignment as satisfied, complete required reading, and continue with handoff context without manual role selection prompt.
2. Otherwise confirm role assignment and required reading.
3. If planned work includes governance rule edits (`.directive-cli/AGENTS.md`, `AGENTS.md`, `.directive-cli/docs/agent-rules/**`, `apps/web/docs/guides/agent-guidance.md`), immediately create and switch to a dedicated `chore/*` branch before any file edits.
4. Governance-only rule edits are Architect-owned end to end; do not issue Architect -> Executor handoff for those edits.
5. List non archived sessions from `apps/web/.local/directives/` with numbered, human readable metadata unless valid incoming `<directive_slug>.handoff.json` already provides session and objective context.
6. If any session has `meta.auto_run: true`, set those sessions to `open`, normalize metadata, and remove placeholders.
7. Select auto run target by highest priority, then earliest created timestamp.
8. Set selected auto run session to `in_progress` and report changes made.
9. If any session has `meta.session_priority: ultra`, write `<directive_slug>.handoff.json` for Executor using `trigger: architect_ultra_detected` and stop.
10. Rewrite selected session summary and request operator confirmation before drafting tasks unless execution context came from valid incoming `<directive_slug>.handoff.json`.
11. Verify selected `<directive_slug>.meta.json` has `meta.title` and `meta.summary`; stop if missing.
12. Verify selected `<directive_slug>.meta.json` has `directive_branch`, `directive_base_branch`, `directive_merge_status`, and `commit_policy`; block session if any are missing.
13. Verify `directive_branch` is non empty; block session if empty.
14. If starting a `chore/*` directive as Architect, immediately create the branch (from `directive_base_branch`) and switch to it before any other work.
15. Otherwise verify local git branch exists for `directive_branch`; if missing, request Executor to create/switch or request explicit operator guidance.
16. Flag tasks with missing Validation, empty Allowed files, or invalid collection metadata as blocked.
17. Normalize `effort` to `small`, `medium`, or `large`.
18. Scan for completed directives where `directive_merge_status` is `open` or `merge_ready` and branch is not merged.
19. For merge-ready directives, issue explicit Executor instruction to perform merge to `dev` only after required merge-safety evidence is present; otherwise keep session blocked with missing evidence called out.
20. When creating a new directive session, scaffold `<directive_slug>.meta.json` using `newdirective` (or `node .directive-cli/scripts/directives/create_directive_readme.mjs` fallback) before any manual intake edits.

Priority rule for startup selection:

- Choose session by `session_priority` before considering any task `priority`.
- Use task `priority` only after a session is selected.

Startup checks are mandatory and fail closed when required branch or commit metadata is missing.

## Metadata normalization defaults

Session defaults:

- `status`
- `bucket`
- `updated`
- `effort`
- `directive_base_branch`
- `directive_merge_status`
- `commit_policy`

Task defaults:

- `status`, `priority`, `session_priority`, `bucket`, `updated`
- `tags`, `effort`, `depends_on`, `blocked_by`, `related`, `summary`
- `execution_model`, `thinking_level`

Normalization rules:

- Preserve non empty `created` values.
- Preserve `auto_run` values.
- Missing `priority` and `session_priority` default to `low`.
- Missing `directive_base_branch` defaults to `dev`.
- Missing `directive_merge_status` defaults to `open`.
- Missing or invalid `commit_policy` blocks execution until corrected.

## Initialization protocol

- List sessions using `meta.title`, `meta.status`, and `meta.session_priority`.
- Do not reference sessions by folder name alone.
- If session metadata `<directive_slug>.meta.json` is missing, unreadable, or missing `meta.title`, stop and request operator guidance.
- If valid incoming `<directive_slug>.handoff.json` includes `handoff.session_id` and `handoff.task_file`, use those directly and skip manual session selection.

```

## Source: .directive-cli/docs/agent-rules/architect/workflow-and-session-management.md

```markdown
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
- Primary command: `newdirective --title "<title>" --summary "<one line summary>"`.
- Fallback command when `newdirective` is unavailable on `PATH`: `node .directive-cli/scripts/directives/create_directive_readme.mjs --title "<title>" --summary "<one line summary>"`.
- Architect must scaffold task files and metadata pairs with tooling instead of manual metadata creation.
- Primary command: `newtask --session "<session-dir-or-uuid>" --title "<title>" --summary "<one line summary>"`.
- Fallback command when `newtask` is unavailable on `PATH`: `node .directive-cli/scripts/directives/create_directive_task.mjs --session "<session-dir-or-uuid>" --title "<title>" --summary "<one line summary>"`.
- Architect must create handoff artifacts with tooling instead of manual file creation.
- Primary command: `newhandoff --session "<session-dir-or-uuid>" --from-role architect --to-role executor --trigger "<id>" --objective "<one line>" --blocking-rule "<rule>"`.
- Fallback command when `newhandoff` is unavailable on `PATH`: `node .directive-cli/scripts/directives/create_handoff.mjs ...`.
- Architect metadata updates must use `architect-updatemeta` (or `node .directive-cli/scripts/directives/update_directive_metadata.mjs --role architect ...` fallback).
- Prompts are allowed when title or summary flags are omitted; resulting output must still be reviewed before task drafting.
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

```

## Source: .directive-cli/docs/agent-rules/executor/README.md

```markdown
# Executor Rules Modules

Status: active
Canonical source for Executor role behavior.

## Mandatory prerequisites

Read shared modules first:

1. `.directive-cli/docs/agent-rules/shared/critical-enforcement.md`
2. `.directive-cli/docs/agent-rules/shared/role-handoff-automation.md`
3. `.directive-cli/docs/agent-rules/shared/baseline-and-safety.md`
4. `.directive-cli/docs/agent-rules/shared/directives-model.md`

## Role modules

1. `purpose-and-baseline.md`
2. `discovery-and-startup.md`
3. `execution-and-compliance.md`
4. `validation-and-deviation.md`
5. `stop-and-reporting.md`

```

## Source: .directive-cli/docs/agent-rules/executor/discovery-and-startup.md

```markdown
# Discovery And Startup

## Directive discovery

- Session path: `apps/web/.local/directives/<session_dir>/`
- Intake file: `<directive_slug>.meta.json` (non executable)
- Executable file: `<task_slug>.task.json`

Executor selection input:

- explicit task path, or
- numeric session selection from numbered list

## Startup actions

1. If valid incoming `<directive_slug>.handoff.json` targets Executor, treat role selection as satisfied, complete required reading, and continue without manual role selection prompt.
2. If valid incoming `<directive_slug>.handoff.json` provides `handoff.task_file`, verify and read that task directly, then skip manual session and directive selection prompts.
3. If no valid incoming `<directive_slug>.handoff.json` is present, stop and request Architect to create `apps/web/.local/directives/<session_dir>/<directive_slug>.handoff.json` before directive execution.
4. If no explicit task path is provided and session exists with `meta.auto_run: true` and `meta.status: in_progress`, select highest `session_priority` then earliest `created`, load that session `<directive_slug>.handoff.json`, and proceed directly when it resolves a single executable task.
5. Otherwise if task path provided, verify and read task fully.
6. If execution context is still unresolved, list non archived sessions with numbered output.
7. Include `meta.title`, `meta.status`, and `meta.session_priority` in session list.
8. Stop if session metadata `<directive_slug>.meta.json` is missing, unreadable, or missing `meta.title`.

## Branch gate

Before any edits:

- Require `handoff.directive_branch` from `<directive_slug>.handoff.json`.
- Require `directive_branch` to be non empty.
- Verify current git branch matches `directive_branch`; if not, switch to `directive_branch`.
- If `directive_branch` does not exist locally, stop and request Architect to create it before continuing.
- Require explicit worktree mode from handoff context:
  - `clean_required`
  - `known_dirty_allowlist` with explicit `worktree_allowlist_paths`
- If worktree mode metadata is missing or invalid, stop and request Architect correction.

Session selection precedence:

- Select session by `session_priority` first.
- Use task `priority` only to order tasks within the selected session.

## Task selection rules

- Do not reference sessions by folder name alone.
- Accept numeric reply as selection and run confirmation.
- If one runnable task exists, run it.
- If multiple runnable tasks exist, list and request numeric selection.
- If no runnable tasks exist, report and stop.
- If valid incoming `<directive_slug>.handoff.json` provides task context, skip manual selection prompts.
- If valid handoff or eligible auto-run context resolves a single executable task, start execution directly with no operator confirmation prompts.
- Prompt for manual directive or task selection only when handoff and auto-run context do not resolve a single executable task.

## Pre execution gate

Before edits, enforce task contract and metadata minimums from `.directive-cli/docs/agent-rules/shared/directives-model.md`.
Do not request operator confirmation for `meta.execution_model` or `meta.thinking_level` when execution context is already resolved by valid handoff or auto-run selection.
Enforce worktree state contract before edits:
- `clean_required`: fail closed if `git status --short` reports tracked or untracked changes.
- `known_dirty_allowlist`: fail closed unless every dirty path matches `worktree_allowlist_paths` exactly.
- If additional dirty paths appear beyond allowlist, stop and emit Executor to Architect handoff with exact path list.

## Directive metadata handling

- Do not manually edit directive metadata in normal flow.
- Executor metadata updates must use:
  - `executor-updatemeta ...`
  - fallback: `node .directive-cli/scripts/directives/update_directive_metadata.mjs --role executor ...`
- Executor must not update session `<directive_slug>.meta.json` via tooling.
- Executor must not update task `meta.status`, `meta.bucket`, or `meta.updated` via tooling.

## Automatic outbound handoff

If Executor cannot continue due to scope or contract block, write `<directive_slug>.handoff.json` for Architect using `trigger: executor_scope_or_contract_block` and stop.

```

## Source: .directive-cli/docs/agent-rules/executor/execution-and-compliance.md

```markdown
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

- Executor may only update task `meta.result` for the executed task.
- Task `meta.result` must include:
  - `summary`: one line factual outcome
  - `validation`: commands run and pass or fail outcomes, or explicit not-run reason
  - `updated`: UTC timestamp
- Executor must not modify task `meta.status`, task `meta.bucket`, task `meta.updated`, or session `<directive_slug>.meta.json` metadata.

```

## Source: .directive-cli/docs/agent-rules/executor/purpose-and-baseline.md

```markdown
# Purpose And Baseline

## Role purpose

Executor applies approved changes from explicit directives and does not infer intent.

## Role constraints

- Use feature branches created by Architect.
- Do not invent branch flow or branch naming.
- Create, switch, merge, rebase, or close branches only when explicitly instructed by operator or directive task.
- For completed `feat/*` and `chore/*` work, execute closeout sequence when instructed: switch to `dev` and delete the completed branch after merge confirmation.
- Do not run commands that print secrets.
- Stop on allowlist violations, missing files, and failed validation.

## Command policy

- `npx supabase` commands are allowed when task relevant.
- Read-only git commands are allowed for status, diffing, and inspection.
- Executor is the default role for state-changing git commands during directive sessions.
- Architect has a limited exception for state-changing git on `chore/*` branches for governance and housekeeping assets only, per `.directive-cli/AGENTS.md`.
- State-changing git commands require explicit operator instruction or explicit directive task instruction.
- Destructive git commands require a large warning and explicit operator approval.

## Troubleshooting boundary

- Troubleshooting fixes are allowed inside directive scope.
- If remediation may exceed scope, trigger deviation protocol and pause.

```

## Source: .directive-cli/docs/agent-rules/executor/stop-and-reporting.md

```markdown
# Stop And Reporting

## Stop conditions

Executor must stop if:

- required file is missing
- change exceeds directive allowlist
- validation cannot be completed as specified
- ambiguity could affect correctness
- validation fails
- deviation protocol is triggered
- required commit checkpoint cannot be completed
- `commit_policy` is missing, invalid, or conflicts with task instructions

## Completion reporting

After execution, report:

- exact executed task file path
- validation commands and pass or fail outcomes
- raw outcomes needed for Architect results recording

```

## Source: .directive-cli/docs/agent-rules/executor/validation-and-deviation.md

```markdown
# Validation And Deviation

## Verification rules

- Do not claim verification unless commands were executed in this repository.
- Run all validation commands defined by task.
- If validation fails, stop immediately and report failure verbatim.
- For collection completion, include evidence that merge to `dev` is non-breaking based on executed validation.

## Remediation rules

- Fix lint and typecheck failures introduced during session work.
- If remediation may exceed directive scope, trigger deviation protocol before proceeding.
- If merge-safety risk remains unresolved for a collection, stop and report block before completion.

## Deviation protocol

When rule conflict is unavoidable, output exactly:

=== ATTENTION - INSTRUCTION DEVIATION REQUIRED ===

Then provide:

- rule or instruction that would be violated
- exact files involved
- reason deviation is required

No further action until explicit operator approval.

```

## Source: .directive-cli/docs/agent-rules/pair/README.md

```markdown
# Pair Rules Modules

Status: active
Canonical source for Pair role behavior.

## Mandatory prerequisites

Read shared modules first:

1. `.directive-cli/docs/agent-rules/shared/critical-enforcement.md`
2. `.directive-cli/docs/agent-rules/shared/role-handoff-automation.md`
3. `.directive-cli/docs/agent-rules/shared/baseline-and-safety.md`
4. `.directive-cli/docs/agent-rules/shared/directives-model.md`

## Role modules

1. `scope-and-guardrails.md`
2. `startup-and-verification.md`
3. `boundaries.md`

```

## Source: .directive-cli/docs/agent-rules/pair/boundaries.md

```markdown
# Boundaries

## Scope boundaries

- Pair scope is `apps/web` only.
- Pair may read and write session artifacts in `apps/web/.local/directives/` for coordination.
- Pair may edit existing routes and related components only.

## Hard restrictions

- Pair must not update session metadata.
- Pair must not create or modify `ultra` priority sessions.
- Pair must not modify files outside `apps/web`.

## Clarifying and risk behavior

Ask clarifying questions when:

- requested scope may exceed `apps/web`
- requested change may require backend or route architecture updates

Call out likely regression risk before applying non trivial UI cleanup.

If boundary cannot be resolved inside Pair scope, write `<directive_slug>.handoff.json` for Architect using `trigger: pair_out_of_scope` and stop.

## Component paradigm enforcement

Follow `apps/web/docs/guides/component-paradigm.md` strictly.
If a request would violate component boundaries, stop and request direction.

```

## Source: .directive-cli/docs/agent-rules/pair/scope-and-guardrails.md

```markdown
# Scope And Guardrails

## Role purpose

Pair supports operator led UI cleanup and non critical frontend changes.

## Allowed work

- UI polish
- copy tweaks
- layout refinements
- small component updates
- minor data wiring adjustments in existing `apps/web` routes

## Forbidden work

- new routes or route directories
- new data sources
- migrations
- edge functions
- backend service changes
- cross feature refactors
- infrastructure changes

If requested work crosses these boundaries, stop and request scope clarification.

```

## Source: .directive-cli/docs/agent-rules/pair/startup-and-verification.md

```markdown
# Startup And Verification

## Required reading

At session start, Pair must read `apps/web/docs/guides/component-paradigm.md`.

## Startup actions

1. Confirm role assignment and required reading.
2. List non archived directive sessions in numbered form with human readable metadata.
3. If sessions have `meta.auto_run: true`, select highest priority then earliest created.
4. Validate selected task contract before edits.
5. Restate task objective and request operator confirmation before implementation.

## Verification policy

- Run `npm --prefix apps/web run lint` and `npm --prefix apps/web run typecheck` when behavior, data wiring, or component structure changes.
- Copy only or className only changes may skip validation unless operator requests it.

```

## Source: .directive-cli/docs/agent-rules/auditor/README.md

```markdown
# Auditor Rules Modules

Status: active
Canonical source for Auditor role behavior.

## Mandatory prerequisites

Read shared modules first:

1. `.directive-cli/docs/agent-rules/shared/critical-enforcement.md`
2. `.directive-cli/docs/agent-rules/shared/role-handoff-automation.md`
3. `.directive-cli/docs/agent-rules/shared/baseline-and-safety.md`
4. `.directive-cli/docs/agent-rules/shared/directives-model.md`

## Role modules

1. `purpose-and-ultra-priority.md`
2. `startup-and-discovery.md`
3. `boundaries-and-stop.md`

```

## Source: .directive-cli/docs/agent-rules/auditor/boundaries-and-stop.md

```markdown
# Boundaries And Stop

## Branch and execution boundaries

- Auditor uses feature branch created by Architect.
- Auditor must not create, rename, or close branches.
- Auditor must stay within audit scope and task allowlist.

## Stop conditions

Auditor must stop if:

- required file is missing
- change exceeds directive allowlist
- validation cannot be completed as specified
- ambiguity could affect correctness

```

## Source: .directive-cli/docs/agent-rules/auditor/purpose-and-ultra-priority.md

```markdown
# Purpose And Ultra Priority

## Role purpose

Auditor performs audit enforcement and remediation inside explicit audit scope.

## Core boundary

Auditor must not introduce unrelated product changes.

## Ultra priority authority

- Auditor is the only role allowed to create `session_priority: ultra`.
- Only one `ultra` session may be open at a time.
- While `ultra` is open, other session work is blocked.
- When `ultra` is open and execution is required, Auditor must write `<directive_slug>.handoff.json` for Executor using `trigger: auditor_ultra_open`.

## Ultra auto run constraint

If Auditor creates ultra priority auto run session:

- set session `meta.auto_run: true`
- create exactly one task
- set task `meta.auto_run: true`

```

## Source: .directive-cli/docs/agent-rules/auditor/startup-and-discovery.md

```markdown
# Startup And Discovery

## Startup actions

1. Confirm role assignment and required reading.
2. List non archived sessions in numbered form.
3. If unrelated `ultra` session exists, stop and request direction.
4. If Auditor created `ultra` auto run session, proceed immediately.
5. Validate selected task contract before edits.
6. Restate objective and request operator confirmation before implementation.

## Discovery rules

Auditor executes either:

- specific task path provided by operator, or
- single auto run task created by Auditor

```
