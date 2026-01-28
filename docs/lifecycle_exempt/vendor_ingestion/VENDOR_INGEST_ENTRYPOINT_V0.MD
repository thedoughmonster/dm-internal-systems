# Vendor ingest entry point v0

## Sniff then confirm flow
- Send raw CSV or JSON body with `csv` to sniff format.
- Sniff response returns a proposed match, ambiguity, or unknown format.
- Client must send a second request with `confirm=true` to allow writes.
- Confirm requests must pass expected identifier binding checks when provided.

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

## Adding new identifiers and handlers
1. Add a new identifier function in `supabase/functions/vendor_ingest/identifier_functions`.
2. Register the identifier in `supabase/functions/vendor_ingest/identify.ts`.
3. Implement the ingestion handler in `supabase/functions/vendor_ingest/ingestion_handlers`.
4. Register the handler adapter in `supabase/functions/vendor_ingest/dispatch.ts`.
5. Validate sniff and confirm flows against the new format.

## Audit note
Audit entries are returned in the response only in v0. No database writes occur for audit.
