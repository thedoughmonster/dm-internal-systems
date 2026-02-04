# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: directives filters and list UI
- Branch: unknown
- Author: codex

## Summary
- merge filters into the directive files card and add a show archived toggle
- replace status filter with multi-select, remove directive filter, and add mark complete action per entry
- refresh directive list layout and add action grouping

## Files touched
- `apps/web/app/directives/composites/DirectivesView.tsx`: restructure filters, list layout, and add mark complete action
- `apps/web/app/directives/actions.ts`: add complete directive action
- `apps/web/app/directives/composites/TagsMultiSelect.tsx`: use native hidden inputs to avoid layout spacing

## Decisions
- Archived entries are hidden by default unless show archived is enabled.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- Filters remain submit-driven; consider live filtering if desired.

## Commands run
- None

## Verification
- Not run (not requested)
