# Sysco Invoice v1 Notes

## Export structure
- H, F, P record CSV.
- H record contains invoice header values.
- F record provides the ordered field labels for P lines.
- P record contains line item values in the same order as F.

## Deterministic mapping rules
- Signature requires H, F, and P records with the Sysco invoice v1 F label list.
- H record parsing
  - site_or_route_code: tokens[1]
  - location_number: tokens[2]
  - customer_number: tokens[3]
  - created_at_text: tokens[4]
  - invoice_date: tokens[5] in MM/DD/YYYY, stored as YYYY-MM-DD
  - vendor_invoice_number: tokens[9] or tokens[10]
  - total_dollars: tokens[11]
  - status: tokens[13]
- F labels are normalized with trim, space collapse, and uppercase.
- Required F labels for P mapping
  - SUPC
  - CASE QTY
  - SPLIT QTY
  - PACK/SIZE
  - BRAND
  - DESCRIPTION
  - PER LB
  - CASE $
  - EACH $
- P record mapping
  - vendor_sku: SUPC
  - vendor_sku_normalized: trimmed, uppercase, remove spaces
  - description: DESCRIPTION
  - brand: BRAND
  - pack_size_text: PACK/SIZE stored in raw only
  - case_qty: CASE QTY
  - split_qty: SPLIT QTY
  - case_price_dollars: CASE $
  - each_price_dollars: EACH $
- Quantity and pricing
  - If case_qty > 0, quantity is case_qty, uom is CASE, unit_price_cents from CASE $
  - Else if split_qty > 0, quantity is split_qty, uom is EACH, unit_price_cents from EACH $
  - Else quantity, uom, and unit_price_cents are null
  - extended_price_cents is quantity * unit_price_cents when both are present
- Catalog linking
  - vendor_id is resolved from vendors.vendor_key
  - vendor_catalog_items is matched by vendor_id and vendor_sku_normalized
  - unmatched is true with reason NO_CATALOG_MATCH when no catalog match

## Idempotency behavior
- vendor_invoices is upserted by vendor_id and vendor_invoice_number.
- vendor_invoice_lines are deleted for the invoice id before reinserting.

## Known limitations
- Extended price is derived as quantity times unit price using CASE or EACH.
- Totals are derived only from the H total field when present.

## Incompatibility detection
- Identification uses identifier functions to detect HFP structure and F label match.
