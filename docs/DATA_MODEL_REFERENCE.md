# Data Model Reference

## Overview
DM Internal Systems defines canonical SOP and data object models for consistent governance.

## Core Entities
| Entity | Description |
|---------|-------------|
| SOP | Standard Operating Procedure definition |
| Agent | Governance or automation actor |
| Amendment | Formal architectural or procedural change |
| Document | Canonical document or record |
| Context | System-wide metadata and configuration |

## Storage
- PostgreSQL schema defines relational backing.
- JSON canonical files define structure and field integrity.
- Migrations ensure consistency across versions.

## Validation
- Canon and data object models are schema-validated.
- Violations result in failed migrations or blocked workflows.
