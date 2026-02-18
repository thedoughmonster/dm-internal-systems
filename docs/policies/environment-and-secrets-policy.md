# Environment and Secrets Policy

## Scope

Defines repository-wide rules for local environment files, secret handling, and environment configuration boundaries.

## Rules

- Never commit local secret files or credentials.
- Treat `.env.local`, `.env.test.local`, and `.env.prod.local` as local-only material.
- Do not print secret values in logs, command output, screenshots, or changelog entries.
- Production secrets must be isolated from development and test secrets.
- Environment behavior must be controlled by environment variables, not hardcoded environment conditionals with embedded credentials.

## Required behavior

- Use test-scoped values for local and preview/testing workflows unless a release procedure explicitly requires production scope.
- Validate secret-file readiness before sync/deploy actions that consume local env sources.
- Stop and escalate if secret scope or target environment is ambiguous.

## Reference

- `docs/architecture/deployment-model.md`
- `docs/operations/environment-setup.md`
