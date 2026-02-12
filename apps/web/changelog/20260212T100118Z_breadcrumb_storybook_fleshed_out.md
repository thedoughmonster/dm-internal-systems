Date (UTC): 2026-02-12T10:01:18Z
Scope: apps/web Breadcrumb Storybook docs and scenarios

## Summary

Replace the generic Breadcrumb Storybook playground with concrete usage scenarios and component-specific docs guidance.

## Files touched

- apps/web/components/ui/breadcrumb.stories.tsx

## Decisions

- Removed generic `ModuleDocsPage`/`ModulePlayground` usage for Breadcrumb stories.
- Added explicit scenarios:
  - `Overview`
  - `DeepHierarchy`
  - `Collapsed` (ellipsis pattern)
  - `CustomSeparator` (slash icon separator)
- Added `meta.args.id` baseline because `Breadcrumb` requires `id` by component contract.
- Kept docs text focused on navigation semantics, current-page behavior, and deep-hierarchy guidance.

## Risks and followups

- `breadcrumb.tsx` still has `BreadcrumbElipssis` displayName typo (existing component issue not changed in this pass).

## Commands run

- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

## Verification

- Typecheck passed.
- Lint passed with pre-existing warnings in `apps/web/app/directives/composites/TagsInput.tsx` only.

