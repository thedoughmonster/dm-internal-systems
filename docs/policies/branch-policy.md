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

## Directive Branch Lifecycle

- Directive-driven work uses a dedicated branch per directive.
- Directive metadata must track branch identity, base branch, merge status, and commit policy.
- No dangling branches are allowed for directive work; stale untracked directive branches are forbidden.
- Merge back to dev is executed only after directive validation and merge-safety gates are satisfied.

## Branch Closeout Hygiene

- When `feat/*` or `chore/*` work is complete and merged to `dev`, branch closeout is mandatory.
- Closeout sequence: switch to `dev`, then delete the completed working branch.
- Closeout is blocked unless the working tree is clean and merge state is confirmed.
- Clean-tree checks may allow active lifecycle operational artifacts when explicitly scoped by lifecycle tooling.
- If remote cleanup is part of the task, delete the remote branch only after local closeout succeeds.

## Release Flow

- Feature and maintenance pull requests merge into `dev`.
- Release promotion is a pull request from `dev` to `prod`.
- Direct push to `prod` is forbidden.
