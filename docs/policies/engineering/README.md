# Engineering Standards Policy Set

## Purpose

This directory defines repository-wide engineering standards used to keep implementation style and behavior consistent across the codebase.

These standards are tool-agnostic and apply to humans, agents, scripts, and CI.

## Documents

- `architecture-and-boundaries.md`
- `naming-and-structure.md`
- `typescript-and-quality.md`
- `api-and-contracts.md`
- `database-and-migrations.md`
- `ui-and-accessibility.md`
- `error-handling-and-observability.md`
- `testing-and-validation.md`
- `definition-of-done.md`

## Enforcement map

- Runtime checks: `runbook validate` policy-bundle checks (required docs present).
- Static checks: lint + typecheck + tests per `docs/policies/validation-policy.md`.
- Review checks: pull request or operator review against `definition-of-done.md`.
