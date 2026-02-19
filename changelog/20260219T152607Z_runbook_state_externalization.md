# Session Changelog

## Date (UTC) and Scope
- Scope: externalize runbook mutable state out of repository and align hooks with global launcher.

## Summary
- Runbook directive/session/log/export state now resolves to user-level external state root by default (`~/.runbook-state/<repo-id>`).
- Added state bootstrap behavior to seed external state from existing repo `.runbook` artifacts.
- Updated git hooks to use `runbook validate` via the global launcher instead of repo-local script path.

## Files Changed
- `.runbook/scripts/runbook_cli.mjs`
- `.githooks/pre-commit`
- `.githooks/pre-push`

## Verification
- `runbook validate` (pass)
- `runbook git helper --dry-run` log path points to `~/.runbook-state/.../session-logs/`
