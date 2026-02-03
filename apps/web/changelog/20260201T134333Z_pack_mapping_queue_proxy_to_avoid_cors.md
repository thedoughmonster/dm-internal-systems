Date (UTC): 2026-02-01T13:43:33Z
Scope: apps/web

Summary of intent:
- Fix browser CORS preflight failures on `/vendors/ingest/pack-mapping` by proxying the queue request through a same-origin Next.js route.

Symptom:
- Browser sends an unauthenticated OPTIONS preflight for a cross-origin POST to the Supabase Edge Function endpoint for `vendor_pack_unmapped_queue_v1`.
- Supabase returns a non-2xx response to the preflight, so the browser blocks the real POST.

Change summary:
- Added a Next.js route handler proxy that performs a server-to-server POST to `vendor_pack_unmapped_queue_v1` using env provided credentials.
- Updated the pack mapping queue client to call the proxy route instead of calling the Supabase function directly.

Files created or modified:
- Created: `app/api/vendor-pack-unmapped-queue/route.ts`
- Modified: `app/vendors/ingest/pack-mapping/composites/PackMappingQueueClient.tsx`
- Created: `changelog/20260201T134333Z_pack_mapping_queue_proxy_to_avoid_cors.md`

Decisions made:
- Proxy only the queue load call via same-origin to avoid browser preflight behavior.
- Use env vars `NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and optionally `NEXT_PUBLIC_INTERNAL_UI_SHARED_SECRET` as required by the directive.

Validation performed:
- `npm --prefix apps/web run lint` (pass)
- `npm --prefix apps/web run typecheck` (pass)

Notes on constraints respected:
- No secrets were logged or returned by the proxy handler.
- No em dash characters were added.
