# Changelog Entry

## Session metadata
- Date (UTC): 2026-01-31
- Scope: ops tooling reorg and archive
- Branch: chore/ops-tooling-root-cleanup
- Author: Codex

## Summary
Move operational machinery into ops_tooling, archive legacy artifacts, and rewire references without changing behavior.

## Files touched
- `ops_tooling/db/`: moved from `db/`
- `ops_tooling/fixtures/`: moved from `fixtures/`
- `ops_tooling/scripts/`: moved from `scripts/`
- `ops_tooling/updates/`: moved from `updates/`
- `ops_tooling/workflows/`: moved from `workflows/`
- `.archive/README_structure.txt`: moved from `README_structure.txt`
- `.archive/codex_session_handoff.txt`: moved from `codex session handoff.txt`
- `.archive/snapshots/snapshots_yesterday/`: moved from `snapshots_yesterday/`
- `AGENTS.md`: updated ops_tooling path reference
- `README.md`: updated ops_tooling path reference
- `CODEBASE_SUMMARY.MD`: updated ops_tooling path references
- `docs/REPO_REORG_PROPOSAL.md`: added Stage 1 completion note
- `docs/canon/actors/README.md`: updated intake and script paths
- `docs/lifecycle_exempt/README.md`: updated updates inbox references
- `.github/workflows/db_migrate.yml`: updated db path
- `.github/workflows/db_query.yml`: updated db path
- `.github/workflows/updates_apply.yml`: updated ops_tooling paths
- `.github/workflows/validate_dm_actors_v1.yml`: updated script and intake paths
- `.github/workflows/validate_dm_actor_model_v1.yml`: updated script path
- `ops_tooling/scripts/actors_append_validated.py`: updated intake path
- `ops_tooling/scripts/extract_to_repo.py`: rewritten with ops_tooling paths and legacy fallback
- `ops_tooling/scripts/generate_repo_context.mjs`: updated classification paths
- `ops_tooling/scripts/toast_api/_common.py`: updated legacy fallback path
- `ops_tooling/scripts/toast_api/README.md`: updated usage paths
- `ops_tooling/workflows/updates-inbox/docs/README.md`: updated inbox path
- `ops_tooling/workflows/updates-inbox/scripts/updates_apply.py`: updated log message path
- `ops_tooling/workflows/updates-inbox/scripts/dm_updates_apply.sh`: updated inbox and applied paths
- `ops_tooling/workflows/updates-inbox/scripts/make_update_zip.sh`: updated usage and inbox paths

## Decisions
- Keep historical references in `docs/DOCUMENTATION_AUDIT.md` and legacy changelog entries unchanged.
- Leave existing proposal content intact and add a short Stage 1 completion note instead of rewriting paths.
- Do not reference `.archive/` in active tooling.
- Master changelog is optional until created.
- Constraints respected: no secrets printed and no em dashes in generated writing.

## Risks and followups
- Update any remaining proposal or audit docs if they become active guidance.
- Validate any automation that expects old root paths outside the updated workflows.

## Commands run
- `git status --porcelain=v1 -b`
- `pwd`
- `git checkout -b chore/ops-tooling-root-cleanup`
- `mkdir -p ops_tooling .archive .archive/snapshots`
- `ls`
- `git mv db ops_tooling/db`
- `git mv fixtures ops_tooling/fixtures`
- `git mv scripts ops_tooling/scripts`
- `git mv updates ops_tooling/updates`
- `git mv workflows ops_tooling/workflows`
- `git mv README_structure.txt .archive/README_structure.txt`
- `git mv "codex session handoff.txt" .archive/codex_session_handoff.txt`
- `git mv snapshots_yesterday .archive/snapshots/snapshots_yesterday`
- `ls node_modules`
- `rg -n "(^|[^a-zA-Z0-9_])(db/|fixtures/|scripts/|updates/|workflows/|snapshots_yesterday/)" .`
- `rg -n "(db/|fixtures/|scripts/|updates/|workflows/)" .github/workflows`
- `sed -n '1,120p' AGENTS.md`
- `sed -n '1,120p' README.md`
- `python3 - <<'PY' ... PY`
- `sed -n '1,200p' CODEBASE_SUMMARY.MD`
- `sed -n '1,200p' .github/workflows/updates_apply.yml`
- `sed -n '1,120p' .github/workflows/validate_dm_actors_v1.yml`
- `sed -n '1,200p' ops_tooling/scripts/generate_repo_context.mjs`
- `rg -n "updates/" ops_tooling/scripts/actors_append_validated.py`
- `rg -n "workflows/updates-inbox" ops_tooling/workflows/updates-inbox/scripts`
- `sed -n '1,200p' ops_tooling/scripts/toast_api/_common.py`
- `sed -n '1,200p' ops_tooling/scripts/toast_api/README.md`
- `sed -n '1,220p' ops_tooling/scripts/extract_to_repo.py`
- `rg -n "snapshots_yesterday" ops_tooling`
- `rg -n "updates/" ops_tooling/scripts`
- `rg --files -g 'MASTER_CHANGELOG.MD'`
- `date -u "+%Y%m%dT%H%M%SZ"`

## Verification
- `rg -n "(^|[^a-zA-Z0-9_])(db/|fixtures/|scripts/|updates/|workflows/|snapshots_yesterday/)" .`
