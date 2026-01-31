# Changelog Entry Template

## Session metadata
- Date (UTC): 2026-01-31
- Scope: repo reference link
- Branch: main
- Author: Codex

## Summary
Add a canonical repo link file and reference it from root and apps/web agent guides.

## Files touched
- `REPO_LINK.md`: add canonical repo URL reference.
- `AGENTS.md`: add repo reference section.
- `apps/web/AGENTS.md`: add repo reference section.
- `changelog/20260131T114818Z_session_summary.md`: record this session.
- `apps/web/changelog/20260131T114818Z_session_summary.md`: record apps/web session.

## Decisions
- Store the repo URL in a single root file to avoid duplication.
- Reference the root file from both agent guides.

## Risks and followups
- Ensure future docs reference `REPO_LINK.md` instead of duplicating the URL.

## Commands run
- git status --porcelain=v1 -b
- git branch --show-current
- date -u +"%Y%m%dT%H%M%SZ"

## Verification
- Confirmed clean working tree before changes.
- Checked URL appears only where intended.
- Checked for em dash characters in updated markdown.
- Verified diff includes only allowed files.
