Date (UTC): 2026-02-13T17:18:00Z
Scope: root / ops_tooling directives context bundling commands

Summary of intent:
- Add fast context bundle commands so Codex can load one compiled context file instead of searching many rule files every run.
- Wire new `context` subcommand behind existing `dc` command surface.
- Add tests for context bundle build/check/show behavior.

Files created or modified by this run:
- ops_tooling/scripts/directives/context_bundle.mjs
- ops_tooling/scripts/directives/bin/context
- ops_tooling/scripts/directives/bin/cli
- ops_tooling/scripts/directives/scripts.test.mjs
- changelog/20260213T171800Z_dc_context_bundle_commands.md

Decisions made:
- Keep context bundle generation in existing directive toolchain (`ops_tooling/scripts/directives`).
- Default output paths:
  - `.codex/context/compiled.md`
  - `.codex/context/compiled.meta.json`
- Include canonical sources by default:
  - `AGENTS.md`
  - `apps/web/docs/guides/component-paradigm.md`
  - `docs/agent-rules/{shared,architect,executor,pair,auditor}/*.md`
- Add `--include` repeatable option for explicit additional files.

Validation performed:
- `ops_tooling/scripts/dc context build --out /tmp/dc-context-smoke/compiled.md --meta /tmp/dc-context-smoke/compiled.meta.json`
- `ops_tooling/scripts/dc context check --out /tmp/dc-context-smoke/compiled.md --meta /tmp/dc-context-smoke/compiled.meta.json`
- `ops_tooling/scripts/dc context show --out /tmp/dc-context-smoke/compiled.md --meta /tmp/dc-context-smoke/compiled.meta.json`
- `ops_tooling/scripts/dc test` (9/9 passing)

Notes on constraints respected:
- Scope limited to directives tooling and tests.
- No product runtime paths modified.
