> Legacy notice: This file belongs to the archived pre-runbook ruleset. It is not authoritative for current sessions. Use `.repo-agent/AGENTS.md`, `docs/repo-rules.md`, and `.runbook/instructions/*.md`.

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
