# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-04
- Scope: textarea component
- Branch: unknown
- Author: codex

## Summary
- archive the custom CRT textarea implementation
- restore the stock shadcn textarea component styling

## Files touched
- `.archive/apps/web/components/ui/textarea.tsx`: archived prior CRT textarea implementation
- `apps/web/components/ui/textarea.tsx`: restore stock shadcn textarea

## Decisions
- Use the default shadcn textarea styling for consistency across the UI.
- `MASTER_CHANGELOG.MD` not present in apps/web.

## Risks and followups
- Any layouts relying on CRT specific padding or controls may need adjustment.

## Commands run
- None

## Verification
- Not run (not requested)
