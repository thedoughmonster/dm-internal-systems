# Vendor ingest entry point v0

## Sniff then confirm flow
- Send raw CSV or JSON body with `csv` to sniff format.
- Analyze is sniff only and must not create sessions.
- Sniff response returns a proposed match, ambiguity, or unknown format.
- Client must send a second request with `confirm=true` to allow writes.
- Confirm requests must pass expected identifier binding checks when provided.
- Confirm creates an ingest session.

## Body parsing and single read rule
- The entry point reads the request body once using `req.text()`.
- JSON body expects `{ "csv": "<text>" }` with optional confirmation fields.
- Non JSON body is treated as raw CSV text.
- Query parameters control confirm and expected fields when using raw CSV.

## Confirmation binding fields
- `expectedId`
- `expectedVendorKey`
- `expectedDocumentType`
- `expectedFormatVersion`

If any provided expected value does not match the proposed match, the request is rejected with `MISMATCHED_CONFIRMATION`.

## Error codes and UI behavior
- `CONFIRMATION_REQUIRED` 400: missing CSV or invalid JSON. UI should prompt for valid input.
- `AMBIGUOUS_MATCH` 409: multiple candidates. UI should ask the user to select and retry with expected binding.
- `UNKNOWN_FORMAT` 422: no known format. UI should stop and allow upload review.
- `INCOMPATIBLE` 422: known format structure but incompatible fields. UI should alert and stop.
- `MISMATCHED_CONFIRMATION` 409: expected binding does not match proposed. UI should not proceed.
- `HANDLER_NOT_FOUND` 500: server misconfiguration. UI should alert and stop.
- `STRUCTURED_TEXT_MISMATCH` 409: structured pack string did not match normalization. UI should alert and stop.
- `NOTES_REQUIRED` 400: notes required when updating a parse. UI should prompt for notes.

## Adding new identifiers and handlers
1. Add a new identifier function in `supabase/functions/vendor_ingest/identifier_functions`.
2. Register the identifier in `supabase/functions/vendor_ingest/identify.ts`.
3. Implement the ingestion handler in `supabase/functions/vendor_ingest/ingestion_handlers`.
4. Register the handler adapter in `supabase/functions/vendor_ingest/dispatch.ts`.
5. Validate sniff and confirm flows against the new format.

## Audit note
Audit entries are returned in the response only in v0. No database writes occur for audit.

## Confirm success fields

- `sessionId` string
- `packIntent` object

## Pack intent semantics

- Computed from invoice lines `raw.pack_size_text`.
- Normalized by trimming ends, collapsing internal whitespace, and uppercasing.
- Unmapped groups are capped at 25.

## Post-v0 follow-ups

### Invoice ingest write summary semantics

The invoice ingestion handlers currently return `linesInserted` as the number of invoice lines processed during ingest, not the number of net new rows created.

This behavior is idempotent at the database level, but the response field name is ambiguous and can be misinterpreted during verification or UI integration.

TODO (post-v0):
- Clarify write summary semantics by splitting into explicit fields such as:
  - `lines_seen`
  - `lines_new`
  - `lines_existing`
- Or alternatively, return a deterministic post-write count of invoice lines for the affected `vendor_invoice_id`.

This is a reporting clarity issue only and does not affect correctness or idempotency.
