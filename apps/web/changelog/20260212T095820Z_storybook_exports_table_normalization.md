Date (UTC): 2026-02-12T09:58:20Z
Scope: apps/web Storybook exports presentation

## Summary

Normalize Storybook exports presentation to table format instead of bullet lists.

## Files touched

- apps/web/lib/storybook/module-playground.tsx

## Decisions

- Replaced the `Exports` bullet list with a two-column table (`Name`, `Kind`) for consistency with docs page export presentation.

## Risks and followups

- None identified; presentational change only.

## Commands run

- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

## Verification

- Typecheck passed.
- Lint passed with existing warnings in `apps/web/app/directives/composites/TagsInput.tsx` only.

