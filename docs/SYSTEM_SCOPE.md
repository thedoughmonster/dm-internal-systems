# DM Internal Systems — Scope and Stack Charter

## Purpose
Define and govern the architecture, technologies, and operational boundaries of Dough Monster’s internal systems.

## Scope
DM Internal Systems provides the canonical backbone for all internal automation, data integrity, and operational governance.  
It is not an application — it is the foundation upon which applications and services depend.

### In-Scope
- Canonical data definitions and schema governance
- Standard operating procedure (SOP) models and validation
- Agent and automation infrastructure
- Database schema, migrations, and queries
- Internal-facing interface and visualization

### Out-of-Scope
- Public or customer-facing systems
- Marketing, analytics, or growth infrastructure
- Third-party vendor data pipelines not governed by internal canon

## Tech Stack
| Layer | Technology | Purpose |
|-------|-------------|----------|
| Web | Next.js (TypeScript, Tailwind) | Visualization and operational UI |
| Automation | Node.js (ESM, MJS) | Canon enforcement, seeding, migration |
| Database | PostgreSQL | Canonical data storage |
| Governance | GitHub Workflows + Canon JSON | Validation and enforcement |
| Repo Context | JSON (dm_repo_context.json) | Metadata and configuration sync |

## Phased Development
1. **Phase 1 — Canon & Lock**: Establish governance and canonical truth.
2. **Phase 2 — Automation**: Build scripts and workflows around canon.
3. **Phase 3 — Interface**: Deliver web and visualization layer.
4. **Phase 4 — Runtime Orchestration**: Agent-driven automation ecosystem.
