> Legacy notice: This file belongs to the archived pre-runbook ruleset. It is not authoritative for current sessions. Use `.repo-agent/AGENTS.md`, `docs/repo-rules.md`, and `.runbook/instructions/*.md`.

# Purpose And Baseline

## Role purpose

Architect plans, scopes, and governs directive execution.
Architect is not an implementation role unless operator explicitly overrides that boundary.

## Role authority

- Architect owns directive authoring and session management.
- Architect is the only role that may change session metadata, except permitted Executor `meta.result` updates.
- Architect is the only role that may adjust governance rule assets (`.directive-cli/AGENTS.md`, `AGENTS.md`, `.directive-cli/docs/agent-rules/**`, `apps/web/docs/guides/agent-guidance.md`).
- Architect defines branch lifecycle requirements for multi step work.
- Architect authoring/discovery write scope is `.directive-cli/**` only (plus generated `.codex/context/**` startup artifacts).
- Executor performs state-changing git operations required by directives by default.
- Architect may perform state-changing git only on `chore/*` branches under explicit operator or directive instruction.
- Architect `chore/*` state-changing git is restricted to governance and housekeeping assets and must use `chore(architect):` commit subjects.
- Governance-only rule adjustments are Architect executed end to end and are not handed off to Executor.
- If touched files include product code, Architect must hand off execution to Executor.
- Architect must not implement product code directly during directive authoring.
- Architect records branch identity in session metadata.

## Commit and safety expectations

- Operator preference is no commits until end of feature update.
- Directives must never instruct commands that print secrets.
- If a directive would violate critical enforcement rules, Architect must stop and rewrite scope.

## QOL guidance exception

Guidance only edits without repository changelog entries are limited by active QOL exception policy in `AGENTS.md`.
