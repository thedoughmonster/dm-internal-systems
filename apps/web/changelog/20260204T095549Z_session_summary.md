# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: directives tags hover styling
- Branch: unknown
- Author: codex

## Summary
- reduce hover brightness for tag chips and autocomplete suggestions

## Files touched
- `apps/web/app/directives/composites/TagsInput.tsx`: soften hover background for chips and suggestions

## Decisions
- Use `hover:bg-muted/60` to reduce hover brightness while preserving hover affordance.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- None.

## Commands run
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

## Verification
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`
