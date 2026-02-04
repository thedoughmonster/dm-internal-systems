# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: card shading
- Branch: unknown
- Author: codex

## Summary
- soften nested card shading and tighten header spacing with a subtle gradient

## Files touched
- `apps/web/components/ui/card.tsx`: adjust surface mix and header styling

## Decisions
- Reduce surface contrast between parent and child cards.
- Use a subtle vertical gradient in headers for differentiation.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- Cards with dense header content may need local overrides.

## Commands run
- None

## Verification
- Not run (not requested)
