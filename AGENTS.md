# DM Internal Systems – Agent Charter (Verified-Only)

## Role assignment requirement

All new conversations or threads must begin with an explicit role assignment.

At the start of a conversation, the agent must ask:

Which role am I being assigned?  
1. Architect  
2. Executor  
3. Pair  

The agent must not proceed until one role is explicitly selected.
After role selection and required reading, list available directive sessions under `apps/web/.local/directives/` and exclude archived sessions by default.

## Required Reading

- `apps/web/README_COMPONENT_PARADIGM.md`
- The agent must read the required file at session start.
- The agent must not proceed with any request until the required reading has been completed.

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
  docs/AGENT_RULES_ARCHITECT.MD  

- Executor  
  Must follow rules defined in:  
  docs/AGENT_RULES_EXECUTOR.MD  

- Pair  
  Must follow rules defined in:  
  docs/AGENT_RULES_PAIR.MD  

- Auditor  
  Must follow rules defined in:  
  docs/AGENT_RULES_AUDITOR.MD  


Agents must not mix roles within a single conversation or thread.
Architects are read only and produce directives.
Executors apply directives exactly and must not infer intent.

## Standard operating procedure

- Default start state is a clean working tree.
- At the start of every session, read `apps/web/README_COMPONENT_PARADIGM.md` and treat it as non negotiable.
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

## Directive storage model

- `apps/web/.local/directives/` is local only and git ignored.
- Each session folder is a GUID.
- `README.md` in the session folder is the parent intake file.
- Each task is a file named `TASK_<slug>.md` in the session folder.
- All directive files use YAML front matter with a `meta` block and a short summary field.

## Repo reference
See `REPO_LINK.md` for the canonical repository URL and access guidance.

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
- No em dashes in generated writing.
- No claims of capability unless verified in this repo.

## Changelog requirement
- Every agent session that modifies any repo root file or any file outside `apps/web` must add exactly one new entry under `changelog/`.
- Filename convention: `changelog/YYYYMMDDThhmmssZ_session_summary.md`.
- Required fields: Date (UTC) and scope, summary of intent, files created or modified by this run, decisions made, validation performed, notes on constraints respected.
- Changelog entries are required even for documentation only changes.

## Documentation and changelog requirements
- Every Codex session adds a new session entry file under `changelog/` if the work touches root scope files.
- Every Codex session adds a new session entry file under `apps/web/changelog/` if the work touches apps/web scope files.
- Update the relevant `MASTER_CHANGELOG.MD` if present, otherwise note that the master changelog is optional until created.
- Each session entry includes: summary, files touched, decisions, risks and followups, commands run, verification.
- Updates inbox workflow assets live under `ops_tooling/workflows/updates-inbox/`.

## Doc lifecycle status
- Lifecycle docs are no longer gating operational changes.
- Lifecycle docs can be updated opportunistically, but changes must always be recorded in changelog entries.

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
- `apps/web/AGENTS.md`
 - `docs/AGENT_RULES_ARCHITECT.MD`
 - `docs/AGENT_RULES_EXECUTOR.MD`

Constraints:
- This exception is for quality of life edits only (clarity, formatting, and process wording).
- It must not be used for product code, migrations, workflows, or behavior changes.
- Every use of this exception must be recorded in the current session `README.md` under a Notes section with date and a short summary of what changed.
