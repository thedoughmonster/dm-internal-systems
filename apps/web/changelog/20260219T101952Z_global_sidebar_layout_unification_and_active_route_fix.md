Date (UTC): 2026-02-19T10:19:52Z
Scope: apps/web

Summary:
- Unified the app shell around one layout-bound global sidebar under a fixed top header.
- Updated shell sizing to viewport-constrained layout with independent sidebar/content scrolling.
- Added icon-collapsible primary sidebar rail with distinct icons per primary route.
- Pinned sidebar footer actions to a stable bottom region.
- Corrected active-route resolution to deterministic single-match behavior (longest matching href) to prevent duplicate active states.

Files touched:
- `apps/web/app/layout.tsx`
- `apps/web/app/composites/global-sidebar-shell.tsx`
- `apps/web/changelog/20260219T101952Z_global_sidebar_layout_unification_and_active_route_fix.md`

Commands run:
- `npm --prefix apps/web run lint`
- `npm --prefix apps/web run typecheck`

Verification:
- Lint passed.
- Typecheck passed.
