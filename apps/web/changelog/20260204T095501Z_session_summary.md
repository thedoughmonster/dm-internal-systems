# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: directives tags chip removal
- Branch: unknown
- Author: codex

## Summary
- make tag chips clickable to remove and remove the close icon

## Files touched
- `apps/web/app/directives/composites/TagsInput.tsx`: remove close icon and make chip remove on click

## Decisions
- Use a click and keyboard accessible removal on the chip itself.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- None.

## Commands run
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

## Verification
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`
