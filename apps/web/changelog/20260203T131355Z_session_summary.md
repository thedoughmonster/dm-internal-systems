Date (UTC): 2026-02-03T13:13:55Z
Scope: apps/web

Summary:
- Moved shared app settings API to `apps/web/lib` and updated imports.
- Added lint enforcement and documentation for no cross route `@/app/*` imports in composites.

Files Touched:
- apps/web/lib/app-settings.ts
- apps/web/app/settings/page.tsx
- apps/web/app/settings/composites/SettingsView.tsx
- apps/web/app/vendors/page.tsx
- apps/web/app/vendors/ingest/price-changes/composites/PriceChangesView.tsx
- apps/web/eslint.config.mjs
- apps/web/README_COMPONENT_PARADIGM.md
- apps/web/app/settings/lib/api.ts (deleted)
- apps/web/app/settings/lib/types.ts (deleted)

Decisions:
- Centralized shared settings API helpers in `apps/web/lib` to avoid cross route imports.
- Enforced composite import boundaries with `no-restricted-imports` on `@/app/**`.

Risks and Followups:
- Follow up by running `npm --prefix apps/web run lint` if needed.

Commands Run:
- ls
- cat apps/web/README_COMPONENT_PARADIGM.md
- sed -n '1,200p' apps/web/app/settings/lib/api.ts
- sed -n '1,200p' apps/web/app/settings/lib/types.ts
- rg -n "eslint|tslint|lint" -g "*eslint*" -g ".eslintrc*" -g "eslint.config.*" -g "package.json" -g "*.md" .
- rg -n "app/settings/lib/api|app/settings/lib/types" apps/web
- sed -n '1,200p' apps/web/app/settings/page.tsx
- sed -n '1,200p' apps/web/app/settings/composites/SettingsView.tsx
- sed -n '1,200p' apps/web/app/vendors/page.tsx
- sed -n '1,120p' apps/web/app/vendors/ingest/price-changes/composites/PriceChangesView.tsx
- sed -n '1,200p' apps/web/eslint.config.mjs
- rg -n "@/app/" apps/web/app -g "**/composites/**/*.ts*"
- date -u +%Y%m%dT%H%M%SZ
- git status -sb
- npm --prefix apps/web run lint

Verification:
- Passed: npm --prefix apps/web run lint

Master Changelog:
- apps/web/MASTER_CHANGELOG.MD not present.
