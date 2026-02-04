# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: directives filters UX
- Branch: unknown
- Author: codex

## Summary
- replace filter checklists with dropdown multi-selects for status and tags
- make filters apply on change with debounced search
- add show archived toggle and reset controls in the directives list card

## Files touched
- `apps/web/app/directives/composites/MultiSelectDropdown.tsx`: new dropdown multi-select component
- `apps/web/app/directives/composites/DirectivesFiltersPanel.tsx`: client-side filters panel with debounced search
- `apps/web/app/directives/composites/DirectivesView.tsx`: integrate new filters panel and options

## Decisions
- Empty selection represents Any for status and tags.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- Debounced search updates the URL; adjust delay if it feels sluggish.

## Commands run
- None

## Verification
- Not run (not requested)
