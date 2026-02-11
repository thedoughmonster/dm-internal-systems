# Session Entry

Date (UTC): 2026-02-11T13:18:01Z
Scope: `apps/web` docs housekeeping

## Summary

- Removed loose markdown docs from `apps/web` root and consolidated web docs under `apps/web/docs/`.
- Relocated UI contract docs and vendor ingest guidance into docs subfolders.
- Replaced stale boilerplate and deferred TODO content with structured docs files.
- Removed invalid `apps/web/.devcontainer/` config that depended on deleted Docker files.
- Updated required-reading and policy references across role docs to the new component paradigm path.

## Files touched

- `apps/web/docs/README.md`
- `apps/web/docs/guides/agent-guidance.md`
- `apps/web/docs/guides/component-paradigm.md`
- `apps/web/docs/contracts/ui-style-contract.md`
- `apps/web/docs/contracts/ui-style-contract.json`
- `apps/web/docs/routes/vendors-ingest-guidance.md`
- `apps/web/docs/notes/internal-activity-loader.md`
- `apps/web/.devcontainer/devcontainer.json` (deleted)
- `apps/web/AGENTS.md` (moved)
- `apps/web/README.md` (moved)
- `apps/web/README_COMPONENT_PARADIGM.md` (moved)
- `apps/web/ui_style_contract.md` (moved)
- `apps/web/ui_style_contract.json` (moved)
- `apps/web/app/vendors/ingest/AGENTS.md` (moved)

## Decisions

- Active web docs belong in `apps/web/docs/` rather than app root or route folders.
- Required reading pointer for web UI work is now `apps/web/docs/guides/component-paradigm.md`.
- Deferred internal activity loader notes were moved from README TODO text into `apps/web/docs/notes/internal-activity-loader.md`.

## Risks and followups

- Historical changelog entries still reference old paths by design; no active docs reference old locations.
- If any external tooling was hardcoded to old web doc paths, it must be updated to `apps/web/docs/...`.

## Commands run

- `find apps/web -type f -name '*.md' -o -name '*.json' ...` audits
- `rg -n ...` path-reference sweeps
- `mv` commands to relocate docs into `apps/web/docs/`
- `rm -rf apps/web/.devcontainer`

## Verification

- Verified no `.md` files remain at `apps/web` root.
- Verified no active references remain to old web doc paths in non-changelog files.
- Verified required-reading references now use `apps/web/docs/guides/component-paradigm.md`.
