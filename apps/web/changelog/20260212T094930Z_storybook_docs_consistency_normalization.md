Date (UTC): 2026-02-12T09:49:30Z
Scope: apps/web Storybook docs consistency normalization

## Summary

Normalize Storybook docs format/content across component stories and shared docs page copy.

## Files touched

- apps/web/components/ui/*.stories.tsx
- apps/web/components/ui/dm/file-picker.stories.tsx
- apps/web/components/ui/dm/multi-file-picker.stories.tsx
- apps/web/lib/storybook/module-docs-page.tsx

## Decisions

- Rewrote scaffold-derived stories to use a consistent docs description template with corrected component naming/casing (for example `Input OTP`).
- Split accessibility wording by component type:
  - interactive components: focus, keyboard, assistive text validation language
  - non-interactive components: semantics and contrast validation language
- Added missing `parameters.docs.description.component` blocks to handcrafted stories (`button`, `input`, `label`, `badge`, `card`) to align format.
- Replaced remaining scaffold phrasing in `module-docs-page.tsx` with neutral reference-page language.

## Risks and followups

- Some stories still use shared `ModulePlayground` composition and should receive richer component-specific scenarios over time.

## Commands run

- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

## Verification

- Typecheck passed.
- Lint passed with pre-existing warnings in `apps/web/app/directives/composites/TagsInput.tsx` only.
- Automated checks confirmed:
  - no remaining `Auto-generated docs scaffold` copy
  - no remaining `Input Otp` title/module naming
  - all UI and DM story files include `docs.description.component`

