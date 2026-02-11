# Vendors ingest UI guidance

STATUS: INFORMATIONAL
SCOPE: apps/web/app/vendors/ingest

This file is informational only. It must not block Executor work.

Intent
- Provide an internal UI control surface for vendor ingestion.
- Analyze is read only.
- Confirm writes through Edge Functions and creates ingest sessions.
- Multi file ingest is supported.

Pointers
- Primary UI entry: `/vendors/ingest`
- Sessions list: `/vendors/ingest/sessions`
- Session detail: `/vendors/ingest/sessions/<session_id>`
- Global pack mapping queue: `/vendors/ingest/pack-mapping`

Constraints
- No auth in v0.
- No environment switching in UI.
- All writes go through Edge Functions.
