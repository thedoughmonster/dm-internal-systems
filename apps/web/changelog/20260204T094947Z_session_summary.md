# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: directives suggestions focus styling
- Branch: unknown
- Author: codex

## Summary
- reduce active suggestion emphasis to a neutral outline

## Files touched
- `apps/web/app/directives/composites/TagsInput.tsx`: soften active suggestion styling

## Decisions
- Use standard border color instead of bright accent.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- None.

## Commands run
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

## Verification
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`
