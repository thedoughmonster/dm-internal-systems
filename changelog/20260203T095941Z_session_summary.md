Date (UTC): 2026-02-03T09:59:41Z
Scope: supabase

Summary:
- Added vendor price change RPC function to support per vendor price change reporting.

Files Touched:
- supabase/migrations/20260203T094200Z_vendor_price_changes_v1.sql

Decisions:
- Used invoice date averages per vendor catalog item to compute deltas within the window.

Risks and Followups:
- Function assumes unit_price_cents is populated for invoice lines in the window.

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
- MASTER_CHANGELOG.MD not present.
