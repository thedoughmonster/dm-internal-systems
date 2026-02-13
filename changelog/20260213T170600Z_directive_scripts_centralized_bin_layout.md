Date (UTC): 2026-02-13T17:06:00Z
Scope: root / ops_tooling directive script layout cleanup

Summary of intent:
- Centralize all directive command wrappers under `ops_tooling/scripts/directives/bin/`.
- Remove root-level directive wrapper duplication from `ops_tooling/scripts/`.
- Keep a single short entrypoint (`dc`) to invoke directive CLI.
- Update directive tests to call centralized command paths directly.

Files created or modified by this run:
- ops_tooling/scripts/dc
- ops_tooling/scripts/directives/scripts.test.mjs
- ops_tooling/scripts/directives/bin/cli
- ops_tooling/scripts/directives/bin/newdirective
- ops_tooling/scripts/directives/bin/newtask
- ops_tooling/scripts/directives/bin/newhandoff
- ops_tooling/scripts/directives/bin/updatemeta
- ops_tooling/scripts/directives/bin/architect-updatemeta
- ops_tooling/scripts/directives/bin/executor-updatemeta
- ops_tooling/scripts/directives/bin/validatedirectives
- ops_tooling/scripts/directives/bin/migratedirectives
- ops_tooling/scripts/directives/bin/testdirectives
- changelog/20260213T170600Z_directive_scripts_centralized_bin_layout.md
- removed root-level wrappers:
  - ops_tooling/scripts/directives-cli
  - ops_tooling/scripts/newdirective
  - ops_tooling/scripts/newtask
  - ops_tooling/scripts/newhandoff
  - ops_tooling/scripts/updatemeta
  - ops_tooling/scripts/architect-updatemeta
  - ops_tooling/scripts/executor-updatemeta
  - ops_tooling/scripts/validatedirectives
  - ops_tooling/scripts/migratedirectives
  - ops_tooling/scripts/testdirectives

Decisions made:
- Use `ops_tooling/scripts/directives/bin/` as the canonical home for directive command wrappers.
- Keep top-level script surface minimal with only `dc` for directives access.

Validation performed:
- ops_tooling/scripts/dc help
- ops_tooling/scripts/dc test
- ops_tooling/scripts/directives/bin/newdirective --dry-run --title "centralized smoke" --summary "smoke"
- ops_tooling/scripts/directives/bin/validatedirectives --strict

Notes on constraints respected:
- Scope limited to script layout organization and path updates.
- Did not modify directive core logic beyond path correctness in moved wrappers.
