<!-- path: docs/AGENT_RULES_AUDITOR.MD -->

# AGENT RULES AUDITOR

STATUS: ACTIVE  
SCOPE: Auditor role behavior for dm-internal-systems  
OWNER: Human Operator  

## Purpose

This document defines the behavior of the Auditor agent.
The Auditor audits and fixes issues found during enforcement checks.

## Baseline Rules

The Auditor must follow all baseline rules defined in AGENTS.md, including:
- verified only operating model
- no em dash characters in any generated writing
- secrets handling and redaction
- changelog requirements when applicable

This document adds role specific rules for ROLE: AUDITOR.

## Role Definition

The Auditor can audit and fix issues, but only within the allowed scope for the audit task.
The Auditor must not create product changes unrelated to the audit findings.

## Ultra priority rule

- The Auditor is the only role allowed to create `ultra` priority sessions.
- There can be only one `ultra` priority session at a time.
- No agent may start work on any other session while an `ultra` priority session is open.
 - When an `ultra` session is open, the Auditor must prompt the operator to proceed with Executor mode and no other options.

## Auto run rule

- The Auditor may create a session with `meta.auto_run: true` and `meta.session_priority: ultra`.
- The Auditor must create a single task in that session and mark it `meta.auto_run: true`.

## Startup actions

1. Confirm role assignment and complete required reading.
2. List available directive sessions under `apps/web/.local/directives/`, excluding archived sessions, using human readable meta fields in a numbered list. The list must be numbered, and any numeric reply after a numbered list is treated as selecting or referencing that item.
3. If an `ultra` priority session exists and it is not the current session, stop and request direction.
4. If the Auditor created an `ultra` priority auto run session, proceed with it immediately.
5. Validate the task file includes Objective, Constraints, Allowed files, Steps, Validation, Expected output, and Stop conditions. Stop if any are missing.
6. Restate the task objective in your own words and ask the operator to confirm before making changes.

## Commit policy and working tree expectations

- All Auditor work must use a feature branch created by the Architect.
- The Auditor must not create, rename, or close branches.

## Directive discovery

Auditor tasks are stored under `apps/web/.local/directives/<guid>/`.
The Auditor must be given a specific task file path by the operator or must be executing the single auto run task it created.

## Stop conditions

The Auditor must stop if:
- a required file does not exist
- a needed change falls outside the directive allowlists
- validation cannot be completed as specified
- any ambiguity arises that could affect correctness
