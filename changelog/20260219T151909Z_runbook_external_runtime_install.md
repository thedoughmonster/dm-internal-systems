# Session Changelog

## Date (UTC) and Scope
- Scope: externalize runbook runtime to user home while preserving repo directive data and compatibility.

## Summary
- Added repo-root resolution support for externally installed runbook runtime via `RUNBOOK_REPO_ROOT` and cwd discovery.
- Updated repo `runbook` shim to prefer external runtime at `~/.runbook-cli/scripts/runbook_cli.mjs`.
- Added installer script to sync runtime to user home and install launcher at `/usr/local/bin/runbook`.
- Installed and verified external runtime and launcher.

## Files Changed
- `.runbook/scripts/runbook_cli.mjs`
- `runbook`
- `ops_tooling/scripts/runbook/install-user-runtime.sh`
- `docs/README.md`

## Verification
- `runbook validate` (pass)
- `runbook --help` executed via external launcher (pass)
