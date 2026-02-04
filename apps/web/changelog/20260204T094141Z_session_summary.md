# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: directives tags ghost autocomplete
- Branch: unknown
- Author: codex

## Summary
- add ghost text autocomplete and tab cycling for tags input suggestions
- darken chip close control for better contrast

## Files touched
- `apps/web/app/directives/composites/TagsInput.tsx`: ghost text overlay, tab navigation, and dark close control

## Decisions
- Kept autocomplete suggestions in the same component with no new dependencies.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- Ghost text alignment depends on input styling; adjust if input style changes.

## Commands run
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

## Verification
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`
