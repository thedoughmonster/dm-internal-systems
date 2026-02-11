# Vendor Ingestion Architecture

STATUS: REFERENCE  
SCOPE: Vendor ingestion, catalog normalization, and human verified pack parsing  
LAST UPDATED: 2026-01-30

## Purpose

This document describes the architecture for vendor ingestion and pack normalization within DM Internal Systems.  
It exists to explain intent, boundaries, and data flow rather than define machine-consumed contracts.

## High Level Principles

- Supabase Postgres is canonical.
- No automatic inference of pack structure is permitted.
- All pack parsing is human verified and explicit.
- Invoice ingestion and catalog normalization are deliberately separated.
- UI actions map one to one with controlled backend writes.

## System Boundaries

### Ingestion Boundary

Vendor files are ingested through Edge Functions.  
They write immutable invoice records and raw invoice lines.

- `vendor_invoices`
- `vendor_invoice_lines`
  - `raw.pack_size_text` is preserved exactly as received.

No normalization occurs at this boundary.

### Verification Boundary

Human verification occurs after ingestion.

- Raw pack strings are grouped by normalized string.
- Normalization is deterministic:
  - uppercase
  - trim ends
  - collapse internal whitespace

No semantic interpretation occurs here.

### Canonical Mapping Boundary

Verified mappings are stored in:

- `vendor_pack_string_parses`

This table represents the only place structured pack meaning is defined.

Key properties:

- Keyed by vendor and normalized raw pack string
- Written only by explicit Edge Function calls
- Updated only with human intent and notes
- Never inferred, guessed, or auto generated

### Application Boundary

Structured pack data is applied explicitly to catalog items.

- Target: `vendor_catalog_items`
- Source: `vendor_pack_string_parses`
- Triggered only by human action

Invoice lines are never mutated.

## Edge Function Contracts

### vendor_pack_parse_upsert_v1

Purpose:
Create or update a verified pack string mapping.

Responsibilities:

- Compute normalized pack string server side
- Upsert mapping keyed by vendor and normalized string
- Persist evidence and notes
- Reject ambiguous or implicit input

### vendor_pack_parse_apply_to_catalog_item_v1

Purpose:
Apply verified pack structure to a catalog item.

Responsibilities:

- Validate vendor ownership
- Validate normalized string match
- Update catalog item structured pack fields
- Record application evidence

## UI Architecture

### Session Detail View

The vendor ingest session detail view is the primary interaction surface.

Capabilities:

- Display raw pack strings from invoice lines
- Group by normalized pack string
- Show known verified parses
- Create new verified parses
- Apply verified parses to catalog items

No background behavior exists.

### Determinism Guarantees

- No automatic apply
- No background suggestion
- No silent updates
- All state transitions are explicit

## Downstream Consumers

Downstream systems consume only:

- `vendor_catalog_items` structured pack fields

They do not read invoice lines or pack parse tables directly.

## Non Goals

- Regex parsing
- Pattern learning
- Heuristic inference
- Vendor specific magic
- Silent normalization

## Summary

This architecture enforces clarity over convenience.

Every unit of meaning in pack data is:
- Explicit
- Human verified
- Auditable
- Deterministic

This constraint is intentional and foundational.
