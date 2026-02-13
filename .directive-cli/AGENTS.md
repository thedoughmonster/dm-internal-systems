# DM Internal Systems – Agent Charter (Entrypoint)

This file is the startup entrypoint.
Canonical machine-operational rules are policy JSON files under `.directive-cli/policies/` and lifecycle scripts under `.directive-cli/scripts/directives/`.

## Role assignment requirement

All new conversations or threads must begin with explicit role assignment.

Ask:

Which role am I being assigned?
1. Architect
2. Executor
3. Pair
4. Auditor

Do not proceed until one role is selected.

Exception:
- A valid session-local `<directive_slug>.handoff.json` targeting the receiver role counts as explicit role assignment.

## Required reading

- Primary startup context must come from active role bundle output by `dc agent bootstrap` or `dc agent start`.
- If no compiled bundle is active, read `apps/web/docs/guides/component-paradigm.md` and selected role `README.md`.

## Operational source of truth

Operational procedure is script-owned:
- `dc runbook ...`
- `dc directive start|finish ...`
- `dc task start|finish ...`

If markdown procedure text conflicts with runtime script behavior, script behavior wins.

## Canonical machine policies

- `.directive-cli/policies/core.policy.json`
- `.directive-cli/policies/executor.lifecycle.policy.json`
- `.directive-cli/policies/architect.authoring.policy.json`
- `.directive-cli/policies/runbook.flow.json`
- `.directive-cli/policies/handoff.schema.json`

Validate policies with:
- `dc policy validate`

## Directive model

- Session root: `apps/web/.local/directives/<session_dir>/`
- Session file: `<directive_slug>.meta.json`
- Task file: `<task_slug>.task.json`
- Handoff file: `<directive_slug>.handoff.json`

## Metadata tooling policy

Do not edit directive metadata manually in normal flow.
Use tooling:
- `dc directive new`
- `dc directive task`
- `dc directive handoff`
- `dc meta architect`
- `dc meta executor`
- `dc validate`

## Execution context gate

Executor may execute when context is provided by either:
- valid session-local handoff artifact, or
- operator-selected session/task through `dc` lifecycle commands.

## Data access rule

- UI reads and writes go through Edge Functions.
- Do not call Supabase REST endpoints directly from UI code.
- Local directives UI exception: local reads/writes in `apps/web/.local/directives/`.

## Secret handling (mandatory)

- Never print secret values in chat output.
- Redact secrets as `[REDACTED]`.
- If uncertain whether a value is secret, redact.

## Changelog rule

- Sessions touching root scope add one entry under `changelog/`.
- Sessions touching `apps/web` add one entry under `apps/web/changelog/`.

## Role bindings

- Architect: `.directive-cli/docs/agent-rules/architect/README.md`
- Executor: `.directive-cli/docs/agent-rules/executor/README.md`
- Pair: `.directive-cli/docs/agent-rules/pair/README.md`
- Auditor: `.directive-cli/docs/agent-rules/auditor/README.md`
