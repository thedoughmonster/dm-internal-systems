# Storybook Setup

## Purpose

Storybook provides a local workbench for UI component development and consistency checks in `apps/web`.

## Run commands

- Start local Storybook:
  - `npm --prefix apps/web run storybook`
- Run Storybook smoke-test in CI style:
  - `npm --prefix apps/web run storybook -- --ci --smoke-test`
- Build static Storybook output:
  - `npm --prefix apps/web run storybook:build`
- Build CI static Storybook output used by visual regression:
  - `npm --prefix apps/web run storybook:build:ci`

## Preview conventions

- Storybook preview imports `app/globals.css`.
- Storybook preview uses a shared decorator frame with:
  - page padding (`px-6 py-6`)
  - centered container (`mx-auto w-full max-w-6xl`)
  - neutral card surface wrapper (`rounded-2xl border border-border/60 bg-card/40 p-5`)
- Storybook preview layout is `fullscreen`.

## Addon baseline

- Docs via Storybook autodocs in `.storybook/main.ts`.
- Accessibility checks via `@storybook/addon-a11y`.

## Notes

- Stories should be placed under `app/**` or `components/**` using `*.stories.tsx` naming.
- Preview conventions are aligned with `apps/web/docs/contracts/ui-style-contract.md`.

## Baseline story coverage

- `apps/web/components/ui/button.stories.tsx`
  - Covers default plus secondary and destructive variants.
- `apps/web/components/ui/input.stories.tsx`
  - Covers default input and validation-like error presentation with label pairing.
- `apps/web/components/ui/label.stories.tsx`
  - Covers standalone label usage with form field pairing.
- `apps/web/components/ui/card.stories.tsx`
  - Covers common panel composition with header badges, metadata, and footer action patterns.
- `apps/web/components/ui/badge.stories.tsx`
  - Covers default plus secondary and destructive status display variants.

## Optional visual regression in CI

- Workflow: `.github/workflows/ci-baseline.yml` job `visual-regression`.
- Provider: Chromatic (`chromaui/action@v11`).
- Required secret: `CHROMATIC_PROJECT_TOKEN`.
- Build script used by CI visual regression: `storybook:build:ci`.

Fallback behavior when secret is missing:

- The visual regression job stays green and emits a skip message.
- Lint and typecheck remain required baseline checks.
