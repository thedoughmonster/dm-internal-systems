# Vendors Ingest UI slice AGENTS

STATUS: ACTIVE
SCOPE: apps/web/app/vendors/ingest

Purpose
This directory implements the v0 vendors ingestion UI workflow that orchestrates the vendor_ingest Edge Function in two phases: analyze then confirm.

This UI is a control surface only. It does not implement business logic.

Hard rules
1. The Edge Function is the sole authority for file identification and classification.
2. The UI must not implement sniff, signature, or vendor detection logic.
3. All writes go through Edge Functions only.
4. Reads for unmatched queues and ingest sessions go through read only Edge Functions only.
5. No auth in v0. Treat this as internal tooling.
6. Remote only. No local or environment switching in UI.
7. One file per Codex run. No multi file changes.

Routes

/vendors/ingest
- Upload a file
- Call analyze phase
- Render analyze result
- Gate confirm on analysis_status
- Call confirm phase
- Render confirm result

/vendors/ingest/sessions
- List recent ingest sessions
- Read only via Edge Function

/vendors/ingest/sessions/<session_id>
- Show full ingest session detail
- Display analyze payload
- Display confirm payload when present
- Show correlation id and audit details

Edge contracts

Analyze phase
- UI calls vendor_ingest with mode=analyze
- Response includes:
  - analysis_status enum
  - ingest_session_id
  - deterministic file identifier
  - vendor_key when known
  - document_type when known
  - format_version when known
  - expected_id for confirm safety
  - reason_code string
  - safe_hints array
  - correlation_id string

Confirm phase
- UI calls vendor_ingest with mode=confirm
- Request includes:
  - expected_id
  - raw file content
- Response includes:
  - confirm_status enum
  - ingest_session_id
  - correlation_id
  - idempotency indicator
  - totals
  - audit payload

Enums

analysis_status
- ANALYZE_OK_COMPATIBLE
- ANALYZE_KNOWN_INCOMPATIBLE
- ANALYZE_UNKNOWN_VENDOR_OR_TYPE
- ANALYZE_INVALID_STRUCTURE
- ANALYZE_INTERNAL_ERROR

confirm_status
- CONFIRM_SUCCESS
- CONFIRM_REJECTED_MISMATCH
- CONFIRM_ALREADY_INGESTED
- CONFIRM_INTERNAL_ERROR

UI behavior rules
- Confirm button is enabled only for ANALYZE_OK_COMPATIBLE.
- ANALYZE_KNOWN_INCOMPATIBLE must be shown as a format drift warning.
- correlation_id must always be visible when present.
- Raw audit details must be hidden behind an expandable panel.

Artifacts and persistence
- Every analyze and confirm produces an ingest_session_id.
- Sessions are addressable at /vendors/ingest/sessions/<ingest_session_id>.
- Sessions are immutable and read only.
- Sessions are written by Edge Functions only.

Non goals for v0
- No manual SKU resolution UI.
- No catalog editing UI.
- No invoice editing UI.
- No multi file batching.
- No auth enforcement.

Implementation order
One file per Codex run, in this exact order:
1. lib/types.ts
2. lib/api.ts
3. components/FilePicker.tsx
4. components/JsonDetails.tsx
5. components/AnalyzeResultCard.tsx
6. components/ConfirmResultCard.tsx
7. IngestClient.tsx
8. page.tsx
9. sessions/page.tsx
10. sessions/[session_id]/SessionDetails.tsx
11. sessions/[session_id]/page.tsx