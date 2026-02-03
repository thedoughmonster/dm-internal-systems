Date (UTC): 2026-02-03
Scope: apps/web

Summary:
- Required id props across UI components and forwarded ids to root elements.
- Updated app and composite usages to pass deterministic ids.
- Adjusted wrappers for primitives that do not accept refs.

Files touched:
- apps/web/components/ui/*
- apps/web/components/ui/dm/*
- apps/web/app/(internal)/vendor-ingest/session/[sessionId]/composites/PackApplyForm.tsx
- apps/web/app/(internal)/vendor-ingest/session/[sessionId]/composites/PackParseForm.tsx
- apps/web/app/(internal)/vendor-ingest/session/[sessionId]/composites/PackVerificationPanel.tsx
- apps/web/app/(internal)/vendor-ingest/session/[sessionId]/composites/PackVerificationView.tsx
- apps/web/app/composites/global-sidebar-shell.tsx
- apps/web/app/settings/composites/SettingsView.tsx
- apps/web/app/ui-kit/page.tsx
- apps/web/app/vendors/ingest/sessions/composites/VendorIngestSessionsView.tsx
- apps/web/app/vendors/ingest/composites/VendorIngestFlow.tsx
- apps/web/app/vendors/ingest/pack-mapping/composites/PackMappingQueueClient.tsx
- apps/web/app/vendors/ingest/pack-mapping/composites/PackMappingRowForm.tsx
- apps/web/app/vendors/ingest/price-changes/composites/PriceChangesView.tsx
- apps/web/app/vendors/ingest/sessions/[session_id]/SessionDetails.tsx
- apps/web/app/vendors/page.tsx

Decisions:
- Added deterministic ids derived from existing identifiers where possible.
- For primitives without ref support, switched to non-forwardRef wrappers.

Risks and followups:
- Large id surface area increases maintenance; future components should follow the same deterministic id patterns.

Commands run:
- date -u +%Y%m%dT%H%M%SZ
- npm --prefix /root/src/dm-internal-systems/apps/web run typecheck

Verification:
- npm --prefix /root/src/dm-internal-systems/apps/web run typecheck

Notes:
- MASTER_CHANGELOG.MD not found under apps/web at time of update.
