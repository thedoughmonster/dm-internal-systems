# Changelog Entry Template

## Session metadata
- Date (UTC): 2026-01-31
- Scope: updates inbox workflow co-location stage 1
- Branch: chore/workflows-updates-inbox-stage1
- Author: Codex

## Summary
Move updates inbox assets into workflows/updates-inbox and rewire paths without changing behavior.

## Files touched
- `workflows/updates-inbox/inbox/.gitkeep`: moved from updates/inbox.
- `workflows/updates-inbox/inbox/sop_step_0_stack_and_conventions_v1_draft`: moved from updates/inbox.
- `workflows/updates-inbox/inbox/sop_step_0_stack_and_conventions_v1_draft.zip`: moved from updates/inbox.
- `workflows/updates-inbox/applied/.gitkeep`: moved from updates/applied.
- `workflows/updates-inbox/applied/20260119T104745Z_update_system_map_work_surfaces_v0.zip.json`: moved from updates/applied.
- `workflows/updates-inbox/applied/20260119T110733Z_update_system_map_work_surfaces_v0_with_doc.zip.json`: moved from updates/applied.
- `workflows/updates-inbox/applied/VERIFIED_BEHAVIORS.MD`: moved from updates/applied.
- `workflows/updates-inbox/docs/README.md`: moved from updates/README.md and updated paths.
- `workflows/updates-inbox/scripts/updates_apply.py`: moved from scripts and rewired paths.
- `workflows/updates-inbox/scripts/dm_updates_apply.sh`: moved from scripts and rewired paths.
- `workflows/updates-inbox/scripts/make_update_zip.sh`: moved from scripts and rewired paths.
- `workflows/updates-inbox/workflows/README.md`: added pointer to .github workflow location.
- `.github/workflows/updates_apply.yml`: updated to call new script path and new inbox trigger path.
- `README.md`: updated updates inbox location reference.
- `AGENTS.md`: added updates inbox location note.
- `CODEBASE_SUMMARY.MD`: updated updates inbox paths and descriptions.
- `changelog/20260131T131644Z_session_summary.md`: record this session.

## Decisions
- Keep .github/workflows/updates_apply.yml in place due to GitHub Actions constraints.
- Co-locate updates inbox scripts and data under workflows/updates-inbox.

## Risks and followups
- Revisit docs/DOCUMENTATION_AUDIT.md and docs/REPO_REORG_PROPOSAL.md to reflect updated paths.
- Consider adding a lightweight smoke test for updates inbox apply using an empty inbox fixture.

## Commands run
- git status --porcelain=v1 -b
- git checkout -b chore/workflows-updates-inbox-stage1
- mkdir -p workflows/updates-inbox/{inbox,applied,docs,scripts,workflows}
- git mv updates/inbox workflows/updates-inbox/inbox
- git mv updates/applied workflows/updates-inbox/applied
- git mv updates/README.md workflows/updates-inbox/docs/README.md
- git mv scripts/updates_apply.py workflows/updates-inbox/scripts/updates_apply.py
- git mv scripts/dm_updates_apply.sh workflows/updates-inbox/scripts/dm_updates_apply.sh
- git mv scripts/make_update_zip.sh workflows/updates-inbox/scripts/make_update_zip.sh
- ls -la workflows/updates-inbox/inbox
- ls -la workflows/updates-inbox/inbox/inbox
- git mv workflows/updates-inbox/inbox/inbox/.gitkeep workflows/updates-inbox/inbox/
- git mv workflows/updates-inbox/inbox/inbox/sop_step_0_stack_and_conventions_v1_draft workflows/updates-inbox/inbox/
- git mv workflows/updates-inbox/inbox/inbox/sop_step_0_stack_and_conventions_v1_draft.zip workflows/updates-inbox/inbox/
- rmdir workflows/updates-inbox/inbox/inbox
- ls -la workflows/updates-inbox/applied
- ls -la workflows/updates-inbox/applied/applied
- git mv workflows/updates-inbox/applied/applied/.gitkeep workflows/updates-inbox/applied/
- git mv workflows/updates-inbox/applied/applied/20260119T104745Z_update_system_map_work_surfaces_v0.zip.json workflows/updates-inbox/applied/
- git mv workflows/updates-inbox/applied/applied/20260119T110733Z_update_system_map_work_surfaces_v0_with_doc.zip.json workflows/updates-inbox/applied/
- git mv workflows/updates-inbox/applied/applied/VERIFIED_BEHAVIORS.MD workflows/updates-inbox/applied/
- rmdir workflows/updates-inbox/applied/applied
- rg -n "updates/(inbox|applied)|scripts/(updates_apply|dm_updates_apply|make_update_zip)|\.github/workflows/updates_apply\.yml"
- date -u +"%Y%m%dT%H%M%SZ"
- python3 workflows/updates-inbox/scripts/updates_apply.py --help

## Verification
- Confirmed clean working tree before changes.
- Verified updates apply references point to workflows/updates-inbox.
- Confirmed .github/workflows/updates_apply.yml remains for GitHub Actions.
- Ran updates apply script after temporarily emptying workflows/updates-inbox/inbox, observed no packages message.
