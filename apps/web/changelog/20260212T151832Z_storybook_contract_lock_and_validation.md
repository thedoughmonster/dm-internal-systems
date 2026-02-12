# Session Changelog - 2026-02-12T15:18:32Z

## Summary
Executed directive session `3c6224b9-75c2-44ea-aeef-33463413d799` task chain `TASK_00` through `TASK_09`. Locked Storybook docs contract to canonical `Overview` + `VisibleBaseline` naming and completed full normalization validation suite.
Follow-up troubleshooting fixed `ModulePlayground` renderable export detection for React exotic component exports (`forwardRef`/`memo`) that are objects with `$$typeof`.
Follow-up template update aligned custom docs layout order to: title, description, primary story, controls, exports, all stories.
Follow-up conversion moved the remaining 8 default-autodocs story modules to the shared `ModuleDocsPage` custom docs path.
Follow-up consolidation removed exports rendering from `ModulePlayground` so `Overview` remains visual-only and exports are docs-only.
Follow-up border reduction removed redundant docs-frame and section borders to reduce border-in-border layering in Storybook docs.
Follow-up CSS override removed Storybook internal `.sbdocs-preview` border/shadow in docs canvases to further flatten nested frames.
Follow-up normalization standardized `Overview` in 8 converted story modules to always use `ModulePlayground` (no variance), while preserving concrete visual baseline examples under `VisibleBaseline` for `breadcrumb`, `card`, and `label`.

## Files Touched
- `apps/web/docs/guides/storybook-normalization-standard.md`
- `apps/web/docs/guides/storybook-setup.md`
- `apps/web/lib/storybook/module-playground.tsx`
- `apps/web/lib/storybook/module-docs-page.tsx`
- `apps/web/.storybook/preview.ts`
- `apps/web/app/globals.css`
- `apps/web/components/ui/badge.stories.tsx`
- `apps/web/components/ui/breadcrumb.stories.tsx`
- `apps/web/components/ui/button.stories.tsx`
- `apps/web/components/ui/card.stories.tsx`
- `apps/web/components/ui/input.stories.tsx`
- `apps/web/components/ui/label.stories.tsx`
- `apps/web/components/ui/dm/file-picker.stories.tsx`
- `apps/web/components/ui/dm/multi-file-picker.stories.tsx`
- `apps/web/changelog/20260212T151832Z_storybook_contract_lock_and_validation.md`

## Decisions
- Adopted canonical baseline contract language in docs: `Overview` and `VisibleBaseline` are required baseline stories.
- Kept exports-table requirement unchanged.
- Retained existing story module implementations because task validations passed across batches and DM/custom modules.

## Risks And Followups
- `npm --prefix apps/web run lint` reports two existing warnings in `apps/web/app/directives/composites/TagsInput.tsx` (hook dependency warnings). Command still passed with exit code `0`.
- Storybook build reports non-blocking asset-size warnings.

## Commands Run
- Task 00 validation checks (`rg` contract checks for setup/normalization guides)
- Task 01-08 validation loops across allowed story files
- Global contract checks for all UI and DM story modules
- `npm --prefix apps/web run lint`
- `npm --prefix apps/web run typecheck`
- `npm --prefix apps/web run storybook -- --ci --smoke-test`
- `npm --prefix apps/web run storybook:build:ci`
- `npm --prefix apps/web run lint` (follow-up troubleshooting run)
- `npm --prefix apps/web run typecheck` (follow-up troubleshooting run)
- `npm --prefix apps/web run storybook -- --ci --smoke-test` (follow-up troubleshooting run)
- `npm --prefix apps/web run lint` (follow-up docs-template run)
- `npm --prefix apps/web run typecheck` (follow-up docs-template run)
- `npm --prefix apps/web run lint` (follow-up autodocs-to-custom conversion run)
- `npm --prefix apps/web run typecheck` (follow-up autodocs-to-custom conversion run)
- `npm --prefix apps/web run lint` (follow-up overview/docs consolidation run)
- `npm --prefix apps/web run typecheck` (follow-up overview/docs consolidation run)
- `npm --prefix apps/web run lint` (follow-up docs border-reduction run)
- `npm --prefix apps/web run typecheck` (follow-up docs border-reduction run)
- `npm --prefix apps/web run lint` (follow-up docs preview-border override run)
- `npm --prefix apps/web run typecheck` (follow-up docs preview-border override run)
- `npm --prefix apps/web run lint` (follow-up overview normalization run)
- `npm --prefix apps/web run typecheck` (follow-up overview normalization run)

## Verification
- Task 00 validation: pass after doc updates.
- Task 01 through Task 08 validation commands: pass.
- Global contract checks: pass.
- Lint: pass (warnings only).
- Typecheck: pass.
- Storybook smoke test: pass.
- Storybook CI build: pass.
- Follow-up lint/typecheck/smoke-test after export-detection fix: pass.
- Follow-up lint/typecheck after docs-template update: pass.
- Follow-up lint/typecheck after 8-file autodocs-to-custom conversion: pass.
- Follow-up lint/typecheck after removing exports from `ModulePlayground`: pass.
- Follow-up lint/typecheck after docs border-reduction pass: pass.
- Follow-up lint/typecheck after Storybook `.sbdocs-preview` border/shadow override: pass.
- Follow-up lint/typecheck after no-variance `Overview` normalization: pass.
