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
- A valid `=== AUTO HANDOFF ===` packet from the prior role counts as explicit role selection for `to_role`.
- On valid handoff packet, receiving role must complete required reading and continue without asking for manual role re-selection.
- Role transition is allowed only by valid handoff packet or explicit operator role reset.

## Automatic role handoff protocol

- Sender role must stop immediately after emitting a valid handoff packet.
- Receiver role must continue automatically using packet context when packet is valid and targets that role.
- Trigger mappings and required packet fields are defined in `docs/agent-rules/shared/role-handoff-automation.md`.

## Required Reading

- `apps/web/docs/guides/component-paradigm.md`
- The agent must read the required file at session start.
- The agent must not proceed with any request until the required reading has been completed.

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
- Architect `chore/*` state-changing git is limited to governance and housekeeping assets only: `AGENTS.md`, `docs/**`, `changelog/**`, `apps/web/changelog/**`, `apps/web/.local/directives/**`, and `ops_tooling/**`.
- If Architect detects any product code changes in planned or staged files, Architect must stop and hand off to Executor before running state-changing git.
- Architect state-changing commits on `chore/*` must use commit subject prefix `chore(architect):`.
- Architect must not run state-changing git on `feat/*`, `fix/*`, `dev`, or `prod`.
- Other non-Executor roles may run read-only git commands for repository inspection only: `git status`, `git diff`, `git log`, `git show`, `git branch --list`, `git rev-parse`.
- State-changing git commands include `git add`, `git commit`, `git push`, `git pull`, `git checkout`, `git switch`, `git merge`, `git rebase`, `git cherry-pick`, `git stash`, `git reset`, and branch create or delete actions.
- Executor runs state-changing git commands only when explicitly instructed by the operator or explicitly required by an approved directive task.
- Destructive git commands must include a large warning and require explicit operator approval before execution.

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
  docs/agent-rules/architect/README.md  

- Executor  
  Must follow rules defined in:  
  docs/agent-rules/executor/README.md  

- Pair  
  Must follow rules defined in:  
  docs/agent-rules/pair/README.md  

- Auditor  
  Must follow rules defined in:  
  docs/agent-rules/auditor/README.md  


Agents must not mix roles inside a single response.
In-thread role transitions are allowed only through the automatic handoff packet protocol or explicit operator role reset.
Architects are read only and produce directives.
Executors apply directives exactly and must not infer intent.

## Standard operating procedure

- Default start state is a clean working tree.
- At the start of every session, read `apps/web/docs/guides/component-paradigm.md` and treat it as non negotiable.
- Feature updates that require multiple steps must use a feature branch.
- Operator prefers no commits until the end of a feature update.
- Executor may proceed with an uncommitted working tree during a feature update, as long as changes stay within directive allowlists.
- Directive tasks live under `apps/web/.local/directives/<guid>/`.
- Each directive session folder contains a parent `README.md` and task files named `TASK_<slug>.md`.
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
- Each session folder is a GUID.
- `README.md` in the session folder is the parent intake file.
- Each task is a file named `TASK_<slug>.md` in the session folder.
- All directive files use YAML front matter with a `meta` block and a short summary field.

## Directive branch and collection policy

- Every directive must use a dedicated branch per directive and track branch metadata in session `README.md`.
- Required session branch metadata keys are `directive_branch`, `directive_base_branch`, `directive_merge_status`, and `commit_policy`.
- Multi-task directives must include collection metadata keys `collection_id`, `collection_title`, `collection_order`, `collection_commit_label`, and `collection_merge_ready`.
- Architect startup checks must detect completed directives that still need to merge back to dev.
- No dangling branches are allowed for directive work; active blocked or in-progress directive branches are allowed only when tracked in directive metadata.
- Commit policy is explicit: `per_task` requires a per-task commit, `per_collection` requires a collection completion commit, and `end_of_directive` requires final commit checkpoint at directive completion.
- Completed collections must not break dev when merged; minimum verification evidence is required before `collection_merge_ready` is treated as satisfied.

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
- `apps/web/docs/guides/agent-guidance.md`
- `docs/agent-rules/**`

Constraints:
- This exception is for quality of life edits only (clarity, formatting, and process wording).
- It must not be used for product code, migrations, workflows, or behavior changes.
- Every use of this exception must be recorded in the current session `README.md` under a Notes section with date and a short summary of what changed.
