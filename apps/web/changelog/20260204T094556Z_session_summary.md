# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: directives tags chip styling
- Branch: unknown
- Author: codex

## Summary
- mute tag chip background and text color for a softer label treatment

## Files touched
- `apps/web/app/directives/composites/TagsInput.tsx`: adjust chip background and text classes

## Decisions
- Use `bg-muted` and `text-muted-foreground` to reduce brightness.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- None.

## Commands run
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

## Verification
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`
