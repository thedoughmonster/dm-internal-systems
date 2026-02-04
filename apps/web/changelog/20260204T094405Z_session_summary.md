# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: directives tags ghost text
- Branch: unknown
- Author: codex

## Summary
- allow ghost text to render even when input is empty so tab cycling updates the completion display

## Files touched
- `apps/web/app/directives/composites/TagsInput.tsx`: adjust ghost text suffix logic for empty input

## Decisions
- Show full suggestion as ghost text when the input is empty.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- If non prefix suggestions should show ghost text, the matching logic may need tuning.

## Commands run
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

## Verification
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`
