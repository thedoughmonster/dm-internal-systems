Date (UTC): 2026-02-13T17:56:49Z
Scope: root (ops tooling)

Summary of intent:
- Improve `dc codex bootstrap` so profile choice is required and easier in interactive mode.

Files created or modified by this run:
- ops_tooling/scripts/directives/context_bundle.mjs

Decisions made:
- Added profile discovery from existing `config.toml` profile blocks.
- Interactive bootstrap now lists existing profiles and a create-new option.
- Selection accepts either number or direct profile name input.

Validation performed:
- `ops_tooling/scripts/dc test` (pass: 12/12)

Notes on constraints respected:
- No destructive git operations.
- Change scoped to codex bootstrap workflow.
