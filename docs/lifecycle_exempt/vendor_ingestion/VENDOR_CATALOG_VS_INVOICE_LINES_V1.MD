# Vendor Catalog vs Invoice Lines
Version 1

## Purpose

This document defines the canonical separation of responsibility between
`vendor_catalog_items` and `vendor_invoice_lines` in the DM Internal Systems
vendor ingestion pipeline.

This distinction is foundational. It is intentionally explicit to prevent
future ambiguity, schema drift, or misuse of either table.

---

## Core Principle

There are two kinds of truth in vendor ingestion:

1. Reference truth about what a vendor SKU represents in general.
2. Event truth about what was purchased on a specific invoice.

These truths must be stored separately.

---

## vendor_catalog_items
### What this table represents

`vendor_catalog_items` is the canonical reference catalog for a vendor.

Each row represents a stable, reusable identity for a vendor SKU across time.

This table answers the question:

> What is this SKU, in general?

---

### Characteristics

- One row per `(vendor_id, vendor_sku_normalized)`
- Slowly changing over time
- Updated and enriched across many ingests
- Used for matching, costing, and operational planning
- May be created or updated by:
  - purchase history ingests
  - invoice ingests
  - manual unmatched SKU resolution

---

### Canonical responsibilities

A catalog item row may contain:

- Vendor SKU and normalized SKU
- Description and brand
- Pack quantity, pack size, and units of measure
- Active or inactive status
- Last known source update timestamp
- Raw vendor metadata for traceability

This table represents the best known understanding of a vendor item at any
point in time.

It is not a purchase record.

---

## vendor_invoice_lines
### What this table represents

`vendor_invoice_lines` is an immutable transactional history of purchases.

Each row represents a single line item from a specific vendor invoice.

This table answers the question:

> What happened on this invoice, on this date?

---

### Characteristics

- Many rows per invoice
- Append only by ingest
- Never rewritten to reflect future understanding
- Represents what the vendor actually billed and delivered
- Linked to a catalog item when possible

---

### Canonical responsibilities

An invoice line row may contain:

- Vendor SKU as shown on the invoice
- Quantity purchased
- Unit of measure used on the invoice
- Unit price and extended price
- Description as printed on the invoice
- Match status at time of ingest
- Raw invoice row payload for audit

This table represents historical fact, not normalized truth.

---

## Relationship Between the Tables

The tables are intentionally linked but not merged.

- `vendor_invoice_lines.vendor_catalog_item_id` links a purchase event to a
  reference catalog identity.
- This link may be null at ingest time if the SKU is unmatched.
- Once a catalog item exists or is resolved, future invoice lines can match
  automatically.

Historical invoice lines are never rewritten when catalog understanding improves.

---

## Why This Separation Is Required

If only invoice lines existed:
- There would be no stable identity for items
- Catalog enrichment would be scattered across history
- Matching would be repeated work
- Costing and ordering would be brittle

If only catalog items existed:
- Pricing history would be lost
- Invoice auditing would be impossible
- Vendor behavior over time could not be analyzed
- Ingest accuracy could not be verified

The separation enables both correctness and evolution.

---

## Ingest Behavior Contract

During ingest:

- Invoice lines MUST always be written as event records.
- Catalog items MAY be created or enriched from invoice data.
- Structured catalog fields SHOULD be populated whenever possible.
- Raw data MUST be preserved for traceability.
- Invoice lines MUST link to catalog items when matched.
- Unmatched invoice lines MUST remain unmatched until explicitly resolved.

This behavior is intentional and must not be collapsed.

---

## Design Intent

This separation is foundational to:

- Unmatched SKU resolution workflows
- Deterministic vendor ingestion
- Long term cost analysis
- Ethical, auditable operations
- Multi vendor scaling

Any future changes must preserve this distinction.

End of document.
