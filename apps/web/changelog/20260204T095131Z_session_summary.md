# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: directives suggestion emphasis
- Branch: unknown
- Author: codex

## Summary
- emphasize active suggestion by size instead of brightness

## Files touched
- `apps/web/app/directives/composites/TagsInput.tsx`: increase active suggestion size

## Decisions
- Use a larger height and font size for active suggestion to avoid bright highlight.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- None.

## Commands run
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

## Verification
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`
