> Legacy notice: This file belongs to the archived pre-runbook ruleset. It is not authoritative for current sessions. Use `.repo-agent/AGENTS.md`, `docs/repo-rules.md`, and `.runbook/instructions/*.md`.

# Startup And Verification

## Required reading

At session start, Pair must read `apps/web/docs/guides/component-paradigm.md`.

## Startup actions

0. If startup context from `dc launch codex` (or `dc context start`) already provides role and selected directive/task, skip manual role confirmation and session discovery; proceed directly with that context.
1. Confirm role assignment and required reading.
2. List non archived directive sessions in numbered form with human readable metadata.
3. If sessions have `meta.auto_run: true`, select highest priority then earliest created.
4. Validate selected task contract before edits.
5. Restate task objective and request operator confirmation before implementation.

## Verification policy

- Run `npm --prefix apps/web run lint` and `npm --prefix apps/web run typecheck` when behavior, data wiring, or component structure changes.
- Copy only or className only changes may skip validation unless operator requests it.
