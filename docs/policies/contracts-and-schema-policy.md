# Contracts and Schema Policy

## Scope

Defines repository-wide rules for machine-consumed JSON contracts, schemas, and structured metadata.

## Rules

- Structured artifacts must conform to their declared schema/contract shape.
- Do not bypass required fields to force progress.
- Schema/contract changes must be versioned or explicitly migration-safe.
- Breaking changes must include compatibility plan and migration notes.

## Required behavior

- Validate structured artifacts after edits.
- Keep examples and references aligned with schema updates.
- Update related documentation and changelog entries when contract behavior changes.

## Reference

- `contracts/`
- `docs/reference/actors/dm-actor-model-v1.md`
