# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: directives filters dropdown
- Branch: unknown
- Author: codex

## Summary
- keep multi-select dropdowns open on selection until click outside

## Files touched
- `apps/web/app/directives/composites/MultiSelectDropdown.tsx`: prevent dropdown from closing on item select

## Decisions
- Use `onSelect` preventDefault to keep the menu open while toggling items.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- None.

## Commands run
- None

## Verification
- Not run (not requested)
