# Branch Policy

## Scope

This policy defines branch usage, naming, and release flow for this repository.

## Branch Types

- Long lived branches are only `dev` and `prod`.
- `dev` is the integration branch for feature work.
- `prod` is the release branch and must only be updated by pull request merge.

## Branch Naming

- Allowed working branch patterns are `feat/*`, `fix/*`, and `chore/*`.
- All working branches must be created from `dev`.

## Release Flow

- Feature and maintenance pull requests merge into `dev`.
- Release promotion is a pull request from `dev` to `prod`.
- Direct push to `prod` is forbidden.
