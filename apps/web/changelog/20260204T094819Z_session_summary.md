# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: directives suggestions styling
- Branch: unknown
- Author: codex

## Summary
- mute autocomplete suggestion buttons when they are not active

## Files touched
- `apps/web/app/directives/composites/TagsInput.tsx`: add muted styling for inactive suggestions

## Decisions
- Keep active suggestion bright to emphasize focus state.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- None.

## Commands run
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

## Verification
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`
