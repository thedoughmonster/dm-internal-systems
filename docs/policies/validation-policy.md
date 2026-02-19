# Validation Policy

## Scope

Defines repository-wide validation expectations for changes before merge.

## Rules

- Every change must run validation relevant to the changed surface.
- Validation must be deterministic and reproducible.
- Failures must block merge until resolved or explicitly waived by operator/reviewer policy.
- Validation commands and outcomes must be recorded in the change narrative (for example changelog or review notes).

## Minimum baseline

- Static checks for changed code paths (lint/typecheck or equivalents).
- Automated tests for behavior-changing changes when tests exist.
- Contract/schema validation for structured artifacts when schemas exist.

## Required behavior

- Do not claim completion without reporting validation status.
- Validation commands documented in task contracts and operations docs must resolve to existing repository command entrypoints; when an entrypoint is missing, record an explicit command-existence check and unresolved state instead of implying operability.
- If unrelated pre-existing failures block progress, report them explicitly and do not mask them as task failures.
