Date (UTC): 2026-02-03
Scope: apps/web lint boundaries, types migration, docs pointers

Summary:
- Added route boundary lint helper and component import restrictions.
- Added TypeScript correctness options and fixed verbatimModuleSyntax import.
- Moved shared directive types into apps/web/lib/types and updated imports.
- Slimmed the component paradigm pointer after lint enforcement.
- Fixed lint warnings in shadcn primitives by moving use client directives and removing unused ids.

Files created or modified:
- `apps/web/AGENTS.md`
- `apps/web/eslint.config.mjs`
- `apps/web/lib/eslint/route-boundaries.mjs`
- `apps/web/tsconfig.json`
- `apps/web/components/ui/alert-dialog.tsx`
- `apps/web/components/ui/aspect-ratio.tsx`
- `apps/web/components/ui/avatar.tsx`
- `apps/web/components/ui/calendar.tsx`
- `apps/web/components/ui/carousel.tsx`
- `apps/web/components/ui/chart.tsx`
- `apps/web/components/ui/checkbox.tsx`
- `apps/web/components/ui/collapsible.tsx`
- `apps/web/components/ui/command.tsx`
- `apps/web/components/ui/context-menu.tsx`
- `apps/web/components/ui/dialog.tsx`
- `apps/web/components/ui/drawer.tsx`
- `apps/web/components/ui/dropdown-menu.tsx`
- `apps/web/components/ui/field.tsx`
- `apps/web/components/ui/form.tsx`
- `apps/web/components/ui/hover-card.tsx`
- `apps/web/components/ui/input-group.tsx`
- `apps/web/components/ui/input-otp.tsx`
- `apps/web/components/ui/label.tsx`
- `apps/web/components/ui/menubar.tsx`
- `apps/web/components/ui/pagination.tsx`
- `apps/web/components/ui/popover.tsx`
- `apps/web/components/ui/progress.tsx`
- `apps/web/components/ui/radio-group.tsx`
- `apps/web/components/ui/resizable.tsx`
- `apps/web/components/ui/scroll-area.tsx`
- `apps/web/components/ui/select.tsx`
- `apps/web/components/ui/separator.tsx`
- `apps/web/components/ui/sheet.tsx`
- `apps/web/components/ui/sidebar.tsx`
- `apps/web/components/ui/slider.tsx`
- `apps/web/components/ui/sonner.tsx`
- `apps/web/components/ui/switch.tsx`
- `apps/web/components/ui/tabs.tsx`
- `apps/web/components/ui/textarea.tsx`
- `apps/web/components/ui/toggle-group.tsx`
- `apps/web/components/ui/toggle.tsx`
- `apps/web/components/ui/tooltip.tsx`
- `apps/web/components/ui/dm/file-picker.tsx`
- `apps/web/components/ui/dm/multi-file-picker.tsx`
- `apps/web/app/directives/lib/directives-store.ts`
- `apps/web/app/directives/composites/DirectivesView.tsx`
- `apps/web/lib/types/directives/task.d.ts`
- `apps/web/README_COMPONENT_PARADIGM.md`
- `apps/web/.local/directives/ed580453-9c3c-4d22-a099-94182771dbad/TASK_lint-structure-and-types.md`
- `apps/web/.local/directives/ed580453-9c3c-4d22-a099-94182771dbad/TASK_web-ui-docs-slim-after-lint.md`

Files removed:
- `apps/web/types/directives/task.d.ts`
- `apps/web/types/`

Decisions made:
- Route boundary lint uses generated zones from the app directory.
- Shared directive types live under apps/web/lib/types.

Validation performed:
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

Commands run:
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run lint`

Risks and followups:
- Lint produces warnings in shadcn primitives. Consider a follow up to handle warnings if desired.

Notes on constraints respected:
- No em dash characters used.
- Secrets were not printed.
