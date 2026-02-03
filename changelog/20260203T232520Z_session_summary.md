Date (UTC): 2026-02-03
Scope: agent guidance and lint tooling

Summary:
- Added eslint-plugin-import to support route boundary linting.
- Consolidated web UI rules and initialization protocols in agent guidance.

Files created or modified:
- `AGENTS.md`
- `docs/AGENT_RULES_ARCHITECT_V1.MD`
- `docs/AGENT_RULES_EXECUTOR_V1.MD`
- `docs/AGENT_RULES_WEB_UI_V1.MD`
- `package.json`
- `package-lock.json`

Decisions made:
- Route boundary enforcement uses eslint-plugin-import with generated zones.

Validation performed:
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

Commands run:
- `npm install eslint-plugin-import --save-dev`
- `npm install eslint-plugin-import --save-dev --cache /tmp/npm-cache`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

Risks and followups:
- Lint warnings in shadcn primitives were addressed in apps/web changes.
- Ensure lint boundaries remain aligned with route structure as it evolves.

Notes on constraints respected:
- No em dash characters used.
- Secrets were not printed.
