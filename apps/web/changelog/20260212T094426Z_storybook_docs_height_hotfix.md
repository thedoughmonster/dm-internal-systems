Date (UTC): 2026-02-12T09:44:26Z
Scope: apps/web Storybook docs layout wrappers

## Summary

Hotfix Storybook docs wrapper height so component docs cards size to content instead of forcing full viewport height.

## Files touched

- apps/web/.storybook/preview.ts
- apps/web/lib/storybook/module-docs-page.tsx

## Decisions

- Removed `min-h-screen` from the global Storybook consistency frame.
- Removed `min-h-screen` from the module docs page root wrapper.

## Risks and followups

- This change is layout-only and may slightly reduce vertical breathing room on very short stories.

## Commands run

- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

## Verification

- Typecheck passed.
- Lint passed with existing warnings only in `apps/web/app/directives/composites/TagsInput.tsx`.

