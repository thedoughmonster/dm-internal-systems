# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-02
- Scope: apps/web
- Branch: feat/vendor-ingest-finish-20260201
- Author: Codex

## Summary
- Added global sidebar and navigation registry system with accordion sidebar sections.
- Built vendors dashboard with live session and pack queue data.
- Updated UI kit scaffolding, registry, and session detail layout.
- Tuned global scrollbar styling and sidebar layout behavior.

## Files touched
- `app/layout.tsx`: use navigation registry for top nav.
- `app/composites/global-sidebar-shell.tsx`: global sidebar shell and accordion navigation.
- `app/ui-kit/layout.tsx`: simplify layout to use global sidebar.
- `app/ui-kit/[component]/page.tsx`: stub page module export.
- `app/ui-kit/component-examples.tsx`: scaffolded.
- `app/ui-kit/component-registry.ts`: moved to lib.
- `app/ui-kit/lib/component-registry.ts`: moved out of app, now `lib/ui-kit-component-registry.ts`.
- `app/vendors/page.tsx`: vendors dashboard with live data.
- `app/vendors/ingest/sessions/[session_id]/SessionDetails.tsx`: human readable layout with accordions.
- `components/ui/accordion.tsx`: add sidebar variant styling.
- `app/globals.css`: scrollbar styling updates.
- `lib/navigation-registry.ts`: explicit navigation registry with UI kit sections.
- `lib/types/navigation.ts`: navigation types.
- `lib/ui-kit-component-registry.ts`: UI kit component registry.

## Decisions
- Use explicit navigation registry for top nav and sidebar sections.
- Render sidebar sections as accordion panels by default.
- Use offcanvas collapse for the global sidebar to avoid text compression.

## Risks and followups
- Confirm vendors dashboard data sources are correct in production environment.
- Fill in price change data when a source becomes available.

## Commands run
- `npm --prefix apps/web run lint`
- `npm --prefix apps/web run typecheck`

## Verification
- `npm --prefix apps/web run lint`
- `npm --prefix apps/web run typecheck`
