Date (UTC): 2026-02-12T23:28:33Z
Scope: apps/web

Summary:
- Completed directives CSS module migration and token alignment.
- Added directives class-literal lint enforcement and CSS contract validators.
- Fixed directives markdown view styling and directives runtime parse error caused by non-directive markdown artifacts.

Files touched:
- `apps/web/app/globals.css`
- `apps/web/app/styles/*.css`
- `apps/web/app/directives/**/*.tsx`
- `apps/web/app/directives/**/*.module.css`
- `apps/web/app/directives/lib/directives-store.ts`
- `apps/web/eslint.config.mjs`
- `apps/web/lib/eslint/no-raw-classname-literals-in-directives.mjs`
- `apps/web/package.json`
- `apps/web/changelog/20260212T232833Z_directives_css_guardrails_closeout.md`

Decisions:
- Keep directives styling deterministic via CSS modules + token usage.
- Keep global CSS boundary deterministic and mechanically enforced.
- Restrict directive markdown parsing to directive files (`README.md`, `TASK_*`, `ARCHIVE_TASK_*`).

Risks and followups:
- Manual visual checklist/snapshot evidence remains pending.
- Build still emits non-blocking SUSE Mono fallback warning.

Commands run:
- `npm --prefix apps/web run lint`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run validate:global-css-boundary`
- `npm --prefix apps/web run validate:directives-css-contract`
- `npm --prefix apps/web run build`

Verification:
- All above commands pass; build warning is non-blocking.
