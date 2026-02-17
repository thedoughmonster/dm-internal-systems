Date (UTC): 2026-02-17T17:42:24Z
Scope: apps/web

Summary:
- Unified sidebar rail and main content under a centered app shell in `GlobalSidebarShell`.
- Refined desktop inset sidebar presentation to a contained rail-card treatment with updated spacing and elevation.
- Strengthened sidebar menu active/hover/focus-visible states with non-color-only active signaling.
- Added missing sidebar semantic tokens so sidebar colors and rings resolve from explicit theme variables.

Files touched:
- `apps/web/app/composites/global-sidebar-shell.tsx`
- `apps/web/components/ui/sidebar.tsx`
- `apps/web/app/styles/tokens-semantic.css`
- `apps/web/changelog/20260217T174224Z_integrated_sidebar_shell.md`

Decisions:
- Kept route/navigation registry and slot extensibility unchanged; only shell and sidebar presentation were adjusted.
- Kept desktop as persistent rail and mobile as sheet/drawer by preserving existing sidebar interaction semantics.
- Defined sidebar token values using existing semantic/base token primitives (no new dependency or manifest changes).

Commands run:
- `npm --prefix apps/web run lint`
- `npm --prefix apps/web run typecheck`
- `rg -n -e "--sidebar-background" -e "--sidebar-foreground" -e "--sidebar-accent" -e "--sidebar-border" -e "--sidebar-ring" apps/web/app/styles/tokens-semantic.css`

Verification:
- Lint passed.
- Typecheck passed.
- Sidebar semantic token variables are present in `tokens-semantic.css`.
