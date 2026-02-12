<!-- apps/web/docs/guides/storybook-normalization-standard.md -->

# Storybook Normalization Standard

This guide defines a consistent, low-friction standard for Storybook stories and component docs in `apps/web`.
It is intended for normalization passes across many components.

## Goals

- Make every component page predictable: same story names, same sections, same visual rhythm.
- Prefer real rendered examples over prose.
- Avoid “variant overviews” that do not actually show differences.
- Keep docs lightweight: Storybook controls are the primary exploration surface.

## Required Page Shape (Per Component Module)

Each `*.stories.tsx` file must include:

1. A docs page that renders exports in a table (no bullet exports).
2. An `Overview` story that exposes args/controls via `ModulePlayground`.
3. A `VisibleBaseline` story with a concrete render and concrete args.
4. Scenario stories for anything the baseline stories cannot express clearly.

## Story Names (Canonical)

Use these story names where applicable:

- `Overview`: default args/controls via `ModulePlayground`.
- `VisibleBaseline`: concrete baseline render and must not use `ModulePlayground`.
- `Variants`: only if variant values render visibly different UI or behavior.
- `States`: disabled/error/loading/empty where relevant.
- `Composition`: only for composed primitives (Accordion, Tabs, NavigationMenu, etc.).
- `Keyboard`: only when behavior is non-obvious and needs a demo (focus traps, roving tabindex).

If a section doesn’t apply, omit it rather than shipping a misleading placeholder.

## Docs Content (Canonical)

Docs are not a blog post. Keep it structured and skimmable:

- Title: component/module name.
- One-paragraph purpose/usage framing.
- `Exports` table: always present.
- Optional: 2 to 4 bullets under “Next steps” indicating what stories to add as usage evolves.

If additional usage guidance is required, prefer a dedicated story (`States`, `Composition`, `Keyboard`) over adding long prose.

## Variants Normalization Rules

Variant showrooms can be redundant with controls, so they must earn their place.

Include a `Variants` story only when at least one of the following is true:

- The variants are meaningfully different at a glance (colors, layout, density).
- The variants change behavior (interactive affordances, keyboard behavior, rendering strategy).
- The component is used in a small set of canonical styles and you want those styles visible side-by-side.

Do not include `Variants` if:

- All variants render the same (miswired prop or no-op variants).
- The differences are imperceptible at typical viewing sizes.

When `Variants` exists:

- Render all supported values in a grid with labels.
- Use the same children/content for each value so differences are attributable to the prop.
- If a variant requires different content to make the difference visible, add a second mini-row that demonstrates the needed content (and label it).

## Exports Must Be a Table

Exports must render as a table in docs. Prefer `ModuleDocsPage` from `apps/web/lib/storybook/module-docs-page.tsx`.

If a module needs custom docs beyond exports, wrap or extend the docs page, but preserve:

- `Exports` heading
- table layout with `Name` and `Type/Kind`

## Minimal Template (Suggested)

Use this as a starting point for new modules:

- Docs page: `parameters.docs.page` uses `ModuleDocsPage`.
- `Overview`: uses `ModulePlayground` when the module is renderable without special composition.
- `VisibleBaseline`: uses concrete render/args and must not use `ModulePlayground`.
- `Composition` or custom story render when `ModulePlayground` cannot infer usage.

## Verification Checklist

- Storybook loads without runtime errors.
- Docs page has padding and does not force a full-viewport-height wrapper.
- `Overview` controls change the rendered UI.
- `VisibleBaseline` shows a concrete default composition.
- `Variants` (if present) clearly shows differences.
- Exports are displayed in a table.
