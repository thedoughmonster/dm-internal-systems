Date (UTC): 2026-02-12T09:45:34Z
Scope: apps/web Storybook docs wrapper spacing

## Summary

Restore visible horizontal gutter spacing in Storybook docs wrappers.

## Files touched

- apps/web/.storybook/preview.ts
- apps/web/lib/storybook/module-docs-page.tsx

## Decisions

- Use responsive horizontal padding (`px-4 sm:px-6`) on both wrappers to avoid edge-flush rendering on narrow and wide viewports.

## Risks and followups

- None identified; layout-only spacing adjustment.

## Commands run

- `npm --prefix apps/web run typecheck`

## Verification

- Typecheck passed.

