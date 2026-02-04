# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: directives filters loop fix
- Branch: unknown
- Author: codex

## Summary
- stop auto-apply filters from reloading repeatedly when idle

## Files touched
- `apps/web/app/directives/composites/DirectivesFiltersPanel.tsx`: stabilize URL updates and prevent redundant replaces

## Decisions
- Track current search params in a ref to avoid replace loops.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- None.

## Commands run
- None

## Verification
- Not run (not requested)
