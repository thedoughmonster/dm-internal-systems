# Docs Architecture Audit 2026-02-11

## Scope
Audit `docs/` root structure and active references after the role-doc split and canonical-path cleanup.

## Findings
- Root `docs/` now uses purpose-based sections: `agent-rules`, `architecture`, `operations`, `policies`, `reference`, and `audits`.
- Legacy root-level `AGENT_RULES_*.MD` files have been removed from active docs paths.
- Previous canonical JSON contracts now live under `contracts/actors/*`.
- Retired governance authority files were removed from `docs/` and archived under `.archive/docs/`.
- Historical governance-era audit files were moved from `docs/audits/` to `.archive/docs/docs-audits/`.

## Result
Active `docs/` now contains only current-purpose documentation and role guidance, while deprecated governance artifacts are isolated in archive paths.
