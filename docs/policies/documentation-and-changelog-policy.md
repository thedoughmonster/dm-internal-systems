# Documentation and Changelog Policy

## Scope

Defines repository-wide requirements for keeping documentation and changelog records consistent with delivered changes.

## Rules

- Changes that alter behavior, policy, or workflow contracts must update relevant docs in the same change.
- Every completed work session must have a changelog entry in the appropriate location.
- Documentation should separate stable policy from operational procedures and from reference material.

## Required behavior

- Root-scope changes: record in `changelog/`.
- `apps/web` changes: record in `apps/web/changelog/`.
- If docs and implementation diverge, resolve within the same branch before merge.

## Reference

- `README.md`
- `docs/README.md`
