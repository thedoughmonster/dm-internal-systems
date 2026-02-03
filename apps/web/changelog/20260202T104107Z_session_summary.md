Date (UTC): 2026-02-02T10:41:07Z
Scope: apps/web

Summary:
- Add CardTitleBar to shared Card UI for consistent headers.
- Update pack mapping cards to use CardTitleBar with the locked title and subtitle layout.

Files touched:
- Modified: `components/ui/card.tsx`
- Modified: `app/vendors/ingest/pack-mapping/composites/PackMappingQueueClient.tsx`

Decisions:
- Keep subtitle truncation inside CardTitleBar to guarantee one line evidence.

Risks and followups:
- Confirm subtitle truncation still exposes critical evidence on narrow screens.

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
