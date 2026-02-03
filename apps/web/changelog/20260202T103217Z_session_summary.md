Date (UTC): 2026-02-02T10:32:17Z
Scope: apps/web

Summary:
- Reshape pack mapping queue cards with header, subtitle, and body layout.
- Keep each queue item as a single card with a one line subtitle.

Files touched:
- Modified: `app/vendors/ingest/pack-mapping/composites/PackMappingQueueClient.tsx`

Decisions:
- Use a single line subtitle with truncation for evidence fields.

Risks and followups:
- Verify truncation still exposes enough evidence on narrow screens.

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
