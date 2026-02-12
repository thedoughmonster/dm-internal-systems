Date (UTC): 2026-02-12T23:28:33Z
Scope: repository root and apps/web

Summary of intent:
- Complete directives CSS/token migration and enforcement work end-to-end.
- Add deterministic CSS guard tooling under `ops_tooling/`.
- Resolve directives runtime/front-matter parsing regression and markdown formatting regression.

Files created or modified by this run:
- Root scope:
  - `ops_tooling/scripts/css/validate_global_css_boundary.mjs`
  - `ops_tooling/scripts/css/validate_directives_css_contract.mjs`
  - `changelog/20260212T232833Z_directives_css_guardrails_closeout.md`
- Apps/web scope (high-level):
  - `apps/web/app/globals.css`
  - `apps/web/app/styles/*.css`
  - `apps/web/app/directives/**/*.tsx`
  - `apps/web/app/directives/**/*.module.css`
  - `apps/web/app/directives/lib/directives-store.ts`
  - `apps/web/eslint.config.mjs`
  - `apps/web/lib/eslint/no-raw-classname-literals-in-directives.mjs`
  - `apps/web/package.json`

Decisions made:
- Split global CSS into imported foundation files and kept `globals.css` as deterministic entrypoint.
- Enforced directives JSX class usage via custom ESLint rule (no raw class string/template literals).
- Added fail-closed CSS validators for global boundary and directives module CSS contracts.
- Updated directives file loading to parse only directive markdown artifacts and ignore `HANDOFF.md`.

Validation performed:
- `npm --prefix apps/web run lint`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run validate:global-css-boundary`
- `npm --prefix apps/web run validate:directives-css-contract`
- `npm --prefix apps/web run build`

Notes on constraints respected:
- Tooling added under `ops_tooling/`.
- Directives enforcement scoped to `apps/web/app/directives/**/*.{ts,tsx}`.
- No secrets printed or exposed.
