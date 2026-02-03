Date (UTC): 2026-02-02T10:13:14Z
Scope: apps/web

Summary:
- Convert the pack mapping queue from a table into per pack cards with evidence first.
- Add toast based success feedback with a short delay before removing saved or flagged items.

Files touched:
- Modified: `app/vendors/ingest/pack-mapping/composites/PackMappingQueueClient.tsx`
- Modified: `app/vendors/ingest/pack-mapping/composites/PackMappingRowForm.tsx`

Decisions:
- Keep evidence in a single summary row that wraps on smaller screens.
- Delay queue removal by 1.2 seconds after success to show confirmation.

Risks and followups:
- Confirm card density is acceptable on smaller screens.

Commands run:
- `npm --prefix apps/web run lint`
- `npm --prefix apps/web run typecheck`

Verification:
- `npm --prefix apps/web run lint`
- `npm --prefix apps/web run typecheck`

Notes on constraints respected:
- No secret values were printed or logged.
- No em dash characters were added.
- No `MASTER_CHANGELOG.MD` was updated because none exists in `apps/web/`.
