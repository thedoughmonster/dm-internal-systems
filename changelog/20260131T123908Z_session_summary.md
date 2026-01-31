# Changelog Entry Template

## Session metadata
- Date (UTC): 2026-01-31
- Scope: repo reorg proposal
- Branch: main
- Author: Codex

## Summary
Produce a repo specific workflow co-location proposal and staged migration plan.

## Files touched
- `docs/REPO_REORG_PROPOSAL.md`: add the reorganization proposal and migration plan.
- `changelog/20260131T123908Z_session_summary.md`: record this session.

## Decisions
- No files moved in this session; proposal only.

## Risks and followups
- Validate proposed moves in small stages before any path changes.

## Commands run
- git status --porcelain=v1 -b
- pwd
- sed -n '1,200p' README.md
- sed -n '1,220p' AGENTS.md
- sed -n '1,200p' CODEBASE_SUMMARY.MD
- sed -n '1,200p' README_structure.txt
- sed -n '1,200p' .github/workflows/db_migrate.yml
- sed -n '1,200p' .github/workflows/db_query.yml
- sed -n '1,200p' .github/workflows/updates_apply.yml
- sed -n '1,200p' .github/workflows/validate_dm_actor_model_v1.yml
- sed -n '1,200p' .github/workflows/validate_dm_actors_v1.yml
- ls .github/workflows
- ls scripts
- sed -n '1,200p' scripts/actors_append_validated.py
- sed -n '1,220p' scripts/dm_updates_apply.sh
- sed -n '1,200p' updates/README.md
- ls updates
- ls docs
- sed -n '1,200p' docs/DOCUMENT_LIFECYCLE_V1.MD
- sed -n '1,200p' docs/document_lifecycle_v1.json
- sed -n '1,200p' docs/lifecycle_exempt/README.md
- ls db
- ls supabase
- sed -n '1,160p' package.json
- ls .devcontainer
- sed -n '1,200p' compose.yaml
- sed -n '1,200p' Dockerfile
- test -f repo_tree.txt && sed -n '1,120p' repo_tree.txt || echo "repo_tree.txt not present"
- date -u +"%Y%m%dT%H%M%SZ"

## Verification
- Confirmed clean working tree before changes.
- Ensured only docs/REPO_REORG_PROPOSAL.md and this changelog entry were created.
