Date (UTC): 2026-02-13T17:30:00Z
Scope: root / ops_tooling context autostart bootstrap

Summary of intent:
- Extend `dc context` with a bootstrap flow that updates a managed Codex profile block in `~/.codex/config.toml` (or provided `--codex-home`) to auto-load the compiled context bundle.
- Keep context build/check/show commands and add bootstrap visibility in help output.
- Expand directives script tests to validate bootstrap behavior with temp codex home.

Files created or modified by this run:
- ops_tooling/scripts/directives/context_bundle.mjs
- ops_tooling/scripts/directives/bin/cli
- ops_tooling/scripts/directives/scripts.test.mjs
- changelog/20260213T173000Z_dc_context_bootstrap_profile_autostart.md

Decisions made:
- `context bootstrap` always builds a fresh bundle before writing profile block.
- Managed profile block markers are profile-specific for safe idempotent replacement:
  - `# BEGIN dc-context profile <name>`
  - `# END dc-context profile <name>`
- Profile defaults to sanitized repo slug when `--profile` is omitted.

Validation performed:
- `ops_tooling/scripts/dc help`
- `ops_tooling/scripts/dc context bootstrap --codex-home /tmp/dc-codex-smoke --profile smoke_profile --out /tmp/dc-context-smoke2/compiled.md --meta /tmp/dc-context-smoke2/compiled.meta.json`
- `ops_tooling/scripts/dc test` (10/10 passing)

Notes on constraints respected:
- No product/runtime code paths modified.
- Bootstrap validation used temp codex home in `/tmp` to avoid mutating user machine config during test run.
