# DM Internal Systems – Agent Charter (Verified-Only)

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

## SECRET HANDLING AND REDACTION (MANDATORY)
- Never print, paste, or echo secret values into chat output.
- When displaying file contents, diffs, logs, command output, or diagnostics that may contain secrets, redact those values.
- Redaction format must replace values with "[REDACTED]".
- If partial display is explicitly required, show only the first 3 and last 2 characters with "..." in between.
- Treat as secrets by default anything matching patterns like key, token, secret, password, auth, bearer, service_role, api, or long random strings.
- If unsure whether a value is secret, redact it.
- Commands that would echo secrets such as env dumps, .env files, or curl with Authorization headers must not be run unless explicitly requested, and even then must redact.
