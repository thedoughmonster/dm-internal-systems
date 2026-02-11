<!-- docs/reference/vendor-ingestion/PACK_STRING_PARSING_V1.MD -->
# Pack String Parsing
Version 1
Status: reference

## Purpose

This document locks the design intent for human verified pack parsing in the vendor ingestion pipeline.

Goal: convert vendor provided pack strings into structured fields used by costing and downstream systems, without silent inference.

This starts with Sysco invoice exports but must be reusable across vendors and formats.

## Core decisions locked

### Pack parsing must be human verified
The system must never silently infer pack structure.

Automatic parsing may suggest values but must not commit them.

Any unresolved or low confidence pack structure must surface in the UI for human confirmation.

### Verification is tied to the raw pack string
Verification is keyed to the raw pack string, not to a specific SKU.

Examples of raw strings:
- `6/CS 10LB`
- `8/CS 2LB`

If the same raw pack string appears on different SKUs, the verified parse should be reusable.

This decouples learning vendor formatting from learning a specific item.

### Canonical truth still lives on the SKU
Once a pack string is verified, the resulting structured fields must be written to the relevant `vendor_catalog_items` row.

This is what costing and downstream systems read.

The pack string mapping is supporting evidence, not the ultimate source of truth.

## Data model intent

### New table: vendor pack string parses
We will add a dedicated table to store human verified pack string parses.

Key:
- `(vendor_id, normalized_pack_string)`

Stores the human verified structured fields:
- pack_qty
- pack_uom
- pack_size
- pack_size_uom

Also stores audit metadata and raw source context sufficient to explain who verified what and when.

### Existing table: vendor_catalog_items
`vendor_catalog_items` is the canonical reference catalog per vendor SKU.

When a pack string is verified, the system must apply the verified structured fields onto the matching catalog item row.

Costing must read from `vendor_catalog_items`, not from the pack string mapping table.

## UI contract intent

Pack verification UI is embedded in the vendor ingest session detail view.

It must:
- show invoice line items with unresolved pack structure
- display raw pack text and item context
- prefill inputs if a verified parse already exists for the same normalized pack string
- allow human confirmation and save
- write both:
  - the pack string mapping row
  - the catalog item structured fields

## Save behavior intent

Saving a verified pack parse must:
1. Write or update the verified mapping for `(vendor_id, normalized_pack_string)`.
2. Apply the structured fields to the relevant `vendor_catalog_items` row.
3. Ensure future ingests benefit automatically by:
   - prefill from the mapping table
   - applying to new SKUs that share the same verified pack string, once reviewed

## Non goals

- No silent inference that writes structured pack fields without human verification.
- No temporary inference only logic that is treated as correct.
- No hiding unresolved pack structure.
- No rewriting historical invoice lines to reflect future understanding.

End of document.
