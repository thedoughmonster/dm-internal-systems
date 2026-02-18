# Deployment Safety Policy

## Scope

Defines repository-wide safety constraints for release promotion and production mutation.

## Rules

- `prod` is release-only and must be updated by pull request merge.
- Direct push to `prod` is forbidden.
- Production mutations must occur only through approved release flow.
- Release promotion path is `dev` -> `prod` via pull request.
- Production update steps must be gated by successful test-environment validation first.

## Required behavior

- Run required validation gates before merge/promotion.
- Block release when required tests or migration checks fail.
- Keep production deployments isolated from test and preview infrastructure.

## Reference

- `docs/policies/branch-policy.md`
- `docs/architecture/deployment-model.md`
