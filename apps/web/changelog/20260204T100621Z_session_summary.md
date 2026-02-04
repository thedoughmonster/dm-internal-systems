# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: input component
- Branch: unknown
- Author: codex

## Summary
- archive the custom CRT input implementation
- restore the stock shadcn input component styling

## Files touched
- `.archive/apps/web/components/ui/input.tsx`: archived prior CRT input implementation
- `apps/web/components/ui/input.tsx`: restore stock shadcn input

## Decisions
- Use the default shadcn input styling for consistency across the UI.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- Any layouts relying on CRT specific markup may need adjustment.

## Commands run
- None

## Verification
- Not run (not requested)
