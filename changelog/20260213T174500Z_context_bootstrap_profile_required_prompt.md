Date (UTC): 2026-02-13T17:45:00Z
Scope: root / ops_tooling context bootstrap profile safety

Summary of intent:
- Make `dc context bootstrap` require explicit profile scoping so custom context is not applied globally by accident.
- Add interactive prompt for profile name in TTY mode when `--profile` is omitted.
- Fail bootstrap in non-interactive mode when profile is missing.

Files created or modified by this run:
- ops_tooling/scripts/directives/context_bundle.mjs
- ops_tooling/scripts/directives/bin/cli
- ops_tooling/scripts/directives/scripts.test.mjs
- changelog/20260213T174500Z_context_bootstrap_profile_required_prompt.md

Decisions made:
- `--profile` is required for `context bootstrap` semantics.
- In interactive TTY sessions, bootstrap prompts for profile if omitted.
- In non-interactive runs, bootstrap fails closed with explicit message.

Validation performed:
- `ops_tooling/scripts/dc help`
- `ops_tooling/scripts/directives/bin/context --help`
- `ops_tooling/scripts/dc test` (11/11 passing)

Notes on constraints respected:
- Scope limited to directives tooling behavior and tests.
- No product runtime code paths modified.
