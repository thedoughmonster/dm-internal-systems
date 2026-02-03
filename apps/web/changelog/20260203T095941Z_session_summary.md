Date (UTC): 2026-02-03T09:59:41Z
Scope: apps/web

Summary:
- Updated vendor ingest session pack size copy to emphasize ingest time snapshot.
- Added price changes route, UI, and data fetching for per vendor price change reporting.
- Updated vendor dashboard metrics to show pack mapping queue and price change summaries.

Files Touched:
- apps/web/app/vendors/ingest/sessions/[session_id]/SessionDetails.tsx
- apps/web/app/vendors/page.tsx
- apps/web/app/vendors/ingest/price-changes/page.tsx
- apps/web/app/vendors/ingest/price-changes/composites/PriceChangesView.tsx
- apps/web/app/vendors/ingest/price-changes/lib/types.ts
- apps/web/app/vendors/ingest/price-changes/lib/api.ts

Decisions:
- Used latest ingest session vendor_id as the default vendor for price change dashboards.
- Rendered price history as inline tables per item to avoid heavier chart dependencies.

Risks and Followups:
- Large vendor histories may return many invoice lines and could need pagination.
- Confirm RPC responses for numeric fields if formatting issues appear.

Commands Run:
- date -u +%Y%m%dT%H%M%SZ
- test -f apps/web/MASTER_CHANGELOG.MD
- test -f MASTER_CHANGELOG.MD
- npm --prefix apps/web run lint
- npm --prefix apps/web run typecheck

Verification:
- Passed: npm --prefix apps/web run lint
- Passed: npm --prefix apps/web run typecheck

Master Changelog:
- apps/web/MASTER_CHANGELOG.MD not present.
