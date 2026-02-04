# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: directives filter select alignment
- Branch: unknown
- Author: codex

## Summary
- prevent hidden filter input from adding vertical spacing in filter selects

## Files touched
- `apps/web/app/directives/composites/FilterSelect.tsx`: use a hidden native input to avoid space-y margin

## Decisions
- Use a native hidden input with `hidden` attribute so spacing utilities ignore it.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- None.

## Commands run
- None

## Verification
- Not run (not requested)
