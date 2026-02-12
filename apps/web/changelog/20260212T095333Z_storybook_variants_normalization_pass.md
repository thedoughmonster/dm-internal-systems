Date (UTC): 2026-02-12T09:53:33Z
Scope: apps/web Storybook variants normalization

## Summary

Normalize docs story structure so the sidebar only includes variant entries when they add real visual/state signal.

## Files touched

- apps/web/components/ui/*.stories.tsx

## Decisions

- Removed redundant `Variants` exports from scaffold-derived story files that rendered the same `ModulePlayground` output as `Overview`.
- Kept `Overview` as the canonical baseline story for every scaffold-derived component.
- Retained and improved explicit variant canvases where they provide real value:
  - `apps/web/components/ui/badge.stories.tsx` now includes labeled status variants plus `outline`.
  - `apps/web/components/ui/button.stories.tsx` now shows distinct visual and size variants.

## Risks and followups

- Some components still rely on generic `ModulePlayground` for `Overview`; deeper component-specific scenarios can be added incrementally.

## Commands run

- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

## Verification

- Typecheck passed.
- Lint passed with existing warnings in `apps/web/app/directives/composites/TagsInput.tsx` only.
- Automated check confirmed scaffold stories no longer include redundant `Variants` exports.

