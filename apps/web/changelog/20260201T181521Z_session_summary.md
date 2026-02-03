Date (UTC): 2026-02-01T18:15:21Z
Scope: apps/web

Summary of intent:
- Simplify pack mapping row inputs to pack qty, pack size, and pack size UOM.
- Add a one click action to flag a pack string as not supported and remove it from the queue UI on success.

Files created or modified by this run:
- Modified: `app/vendors/ingest/pack-mapping/composites/PackMappingRowForm.tsx`
- Modified: `app/vendors/ingest/pack-mapping/composites/PackMappingQueueClient.tsx`
- Modified: `app/curbside/CheckinClient.tsx`

Decisions made:
- Default pack qty input to 1.
- Keep the action buttons visible and disable them while saving to avoid layout shift.

Validation performed:
- `npm --prefix apps/web run lint` (pass)
- `npm --prefix apps/web run typecheck` (pass)

Notes on constraints respected:
- No secret values were printed or logged.
- No em dash characters were added.
- No `MASTER_CHANGELOG.MD` was updated because none exists in `apps/web/`.
