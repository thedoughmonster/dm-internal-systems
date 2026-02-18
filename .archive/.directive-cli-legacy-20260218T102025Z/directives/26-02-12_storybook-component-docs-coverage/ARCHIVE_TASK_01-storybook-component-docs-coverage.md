---
meta:
  title: "Storybook component docs coverage (single task)"
  status: archived
  priority: high
  session_priority: high
  owner: operator
  assignee: executor
  bucket: todo
  created: 2026-02-12T10:10:00Z
  updated: 2026-02-12T10:10:00Z
  tags: [storybook, ui, components, docs, normalization]
  effort: large
  depends_on: []
  blocked_by: []
  related: []
  summary: "Archived: replaced by TASK_00 through TASK_09 full normalization collection."
  execution_model: gpt-5.2-codex
  thinking_level: medium
---

## Objective

In one bounded executor task, bring Storybook stories and docs for DM UI components into a consistent, reviewable, non-redundant state with at least one concrete visible component render in every story module.

## Constraints

- Prefer story-only changes; do not change component runtime behavior unless required for types/exports and the change is non-breaking.
- Do not add app-only providers or data access to stories.
- Avoid duplicate stories that render the same output.
- Keep exports presentation in docs/playground surfaces as tables (no bullet lists).
- Each story module must include `VisibleBaseline` with a concrete component render; do not satisfy this requirement with `ModulePlayground`.

## Allowed files

- `apps/web/components/ui/*.stories.tsx` (edit)
- `apps/web/components/ui/dm/*.stories.tsx` (create/edit)
- `apps/web/lib/storybook/module-docs-page.tsx` (edit if needed)
- `apps/web/lib/storybook/module-playground.tsx` (edit if needed)
- `apps/web/.storybook/*` (edit if needed)
- `apps/web/docs/guides/storybook-setup.md` (edit if needed)

## Steps

1. Inventory story files:
   - Confirm story coverage exists for every module in `apps/web/docs/contracts/ui-component-inventory.json`.
   - Confirm DM stories exist for `apps/web/components/ui/dm/file-picker.tsx` and `apps/web/components/ui/dm/multi-file-picker.tsx`.
2. Apply the normalization standard to every story module under `apps/web/components/ui/`:
   - `meta.tags` includes `autodocs`.
   - `parameters.docs.description.component` exists and is component-specific (no scaffold copy).
   - `Overview` story exists for every module.
   - `VisibleBaseline` story exists for every module and renders real component usage in canvas.
   - `Variants` story exists only when it shows true visible/state deltas in one canvas; remove redundant `Variants`.
   - Ensure deterministic `sb-` IDs for any rendered examples.
3. For at least one interactive component and one layout component, replace generic auto-playground output with real scenarios:
   - `Breadcrumb` should include deep hierarchy and collapsed/ellipsis patterns.
   - `Button` should include key variants and sizes on one canvas.
4. Ensure exports presentation is consistent:
   - `ModuleDocsPage` exports must be table-based.
   - `ModulePlayground` exports must be table-based.
5. Add/update DM component stories:
   - Each DM story module includes `Overview` plus one non-default state story (e.g. `Disabled`).
   - Each DM story module includes `VisibleBaseline` and this baseline is a concrete render (not `ModulePlayground`).
6. Update docs notes if behavior changes:
   - If any global Storybook preview conventions are changed, reflect them in `apps/web/docs/guides/storybook-setup.md`.

## Validation

```bash
rg -n "Auto-generated docs scaffold" apps/web/components/ui/**/*.stories.tsx && exit 1 || true
rg -n "Auto-generated docs scaffold" apps/web/lib/storybook/module-docs-page.tsx && exit 1 || true
rg -n "Auto-generated docs scaffold" apps/web/lib/storybook/module-playground.tsx && exit 1 || true
for f in apps/web/components/ui/*.stories.tsx apps/web/components/ui/dm/*.stories.tsx; do
  rg -q "export const VisibleBaseline" "$f" || { echo "missing VisibleBaseline in $f"; exit 1; }
done
for f in apps/web/components/ui/*.stories.tsx apps/web/components/ui/dm/*.stories.tsx; do
  rg --pcre2 -U -q "export const VisibleBaseline: Story = \\{[\\s\\S]{0,800}ModulePlayground" "$f" && { echo "VisibleBaseline uses ModulePlayground in $f"; exit 1; } || true
done
```

## Expected output

- Storybook component docs are consistent and non-redundant across `apps/web/components/ui/` and `apps/web/components/ui/dm/`.
- Story docs and playground surfaces present exports in tables (not bullets).
- Every story module has a visible `VisibleBaseline` canvas example that renders a working component.

## Stop conditions

- Stop and ask operator if any story requires app-only context to render meaningfully.
