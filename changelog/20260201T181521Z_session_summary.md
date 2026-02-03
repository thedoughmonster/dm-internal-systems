Date (UTC): 2026-02-01T18:15:21Z
Scope: supabase

Summary of intent:
- Add a flag table and flag unsupported Edge Function to support removing unsupported pack strings from the unmapped queue.
- Simplify `vendor_pack_parse_upsert_v1` inputs to the minimal set used by the UI.

Files created or modified by this run:
- Created: `supabase/functions/vendor_pack_parse_flag_unsupported_v1/index.ts`
- Created: `supabase/migrations/20260201171200_vendor_pack_string_parse_flags_v1.sql`
- Modified: `supabase/functions/vendor_pack_parse_upsert_v1/index.ts`

Decisions made:
- Store unsupported format flags in `public.vendor_pack_string_parse_flags` keyed by `(vendor_id, pack_string_normalized)`.
- Exclude flagged strings from `public.vendor_pack_unmapped_queue_v1` via the updated function definition in the migration.

Validation performed:
- `npm --prefix apps/web run lint` (pass)
- `npm --prefix apps/web run typecheck` (pass)

Notes on constraints respected:
- No secret values were printed or logged.
- No em dash characters were added.
- No `MASTER_CHANGELOG.MD` was updated because none exists at repo root.
 - Typecheck initially failed due to `apps/web/app/curbside/CheckinClient.tsx`; it was fixed under the apps/web changelog entry for this session and typecheck was rerun successfully.
