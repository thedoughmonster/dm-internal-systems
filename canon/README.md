
# DM Systems Platform

Canonical internal operations platform for Dough Monster.

## Purpose

This repository defines the authoritative data models, structural rules, and lifecycle invariants that govern all internal systems at Dough Monster.

It is not an application.  
It is the source of truth that applications, interfaces, and automations must obey.

## Scope

The platform is intended to support, over time:

- SOP authoring, versioning, and approval
- Canonical data references and specifications
- Production and prep data
- Inventory and labeling systems
- Vendor and ingredient data
- Client standing orders and portals
- Event ingestion and normalization
- Operational dashboards and alerts

All systems share:
- The same database
- The same authentication model
- The same data conventions
- The same UI surface

## Source of Truth

- Supabase Postgres is the system of record.
- Canonical truth is expressed as structured JSON.
- Rendered views are mechanically derived.
- If a rendered view conflicts with stored data, the stored data is authoritative.

## Authoring and Enforcement

- Humans do not manually insert or edit production data.
- All writes occur through validated code paths, migrations, or controlled automation.
- Validation is enforced at lifecycle boundaries, not in UI affordances.
- Any artifact that violates canonical models or constitutions is invalid by definition.

## Design Principles

- Modular monolith architecture
- Vertical slices over horizontal abstraction
- Database as the arbiter of truth
- JSON plus relational projections
- Events as first-class citizens

## Project Discipline

This project is committed to a custom-coded internal systems platform.

Architectural decisions are locked.  
Doubt is handled by decomposition, not by changing tools.

This repository favors clarity, auditability, and long-term evolvability over speed or convenience.
