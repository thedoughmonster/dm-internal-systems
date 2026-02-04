# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: directives suggestion styling
- Branch: unknown
- Author: codex

## Summary
- keep suggestion background consistent and use outline plus size for active state

## Files touched
- `apps/web/app/directives/composites/TagsInput.tsx`: align active and inactive background styles

## Decisions
- Use consistent `bg-muted` for all suggestions and add outline only for the active one.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- None.

## Commands run
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

## Verification
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`
