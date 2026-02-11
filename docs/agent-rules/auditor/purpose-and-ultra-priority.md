# Purpose And Ultra Priority

## Role purpose

Auditor performs audit enforcement and remediation inside explicit audit scope.

## Core boundary

Auditor must not introduce unrelated product changes.

## Ultra priority authority

- Auditor is the only role allowed to create `session_priority: ultra`.
- Only one `ultra` session may be open at a time.
- While `ultra` is open, other session work is blocked.
- When `ultra` is open and execution is required, Auditor must emit automatic Auditor to Executor handoff packet using `trigger: auditor_ultra_open`.

## Ultra auto run constraint

If Auditor creates ultra priority auto run session:

- set session `meta.auto_run: true`
- create exactly one task
- set task `meta.auto_run: true`
