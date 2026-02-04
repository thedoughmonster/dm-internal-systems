# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: textarea lint fix
- Branch: unknown
- Author: codex

## Summary
- fix lint by replacing empty interface with a type alias for textarea props

## Files touched
- `apps/web/components/ui/textarea.tsx`: adjust TextareaProps type

## Decisions
- Use a type alias to avoid empty interface lint error.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- None.

## Commands run
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

## Verification
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`
