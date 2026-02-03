Date (UTC): 2026-02-02T10:47:51Z
Scope: apps/web

Summary:
- Replace the pack mapping UOM text input with category and unit selectors plus custom unit input.
- Add collapse animation for saved or flagged cards before removal.

Files touched:
- Modified: `app/vendors/ingest/pack-mapping/composites/PackMappingRowForm.tsx`
- Modified: `app/vendors/ingest/pack-mapping/composites/PackMappingQueueClient.tsx`

Decisions:
- Default unit category to Weight and require explicit unit selection.
- Collapse cards over 300ms before removing them.

Risks and followups:
- Confirm unit labels read well on smaller screens.

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
