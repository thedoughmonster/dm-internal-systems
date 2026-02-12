---
meta:
  date: "2026-02-12T10:52:40Z"
  scope: "apps/web"
  summary: "Add a canonical Storybook normalization standard for docs/stories."
---

## Summary
- Adds a lightweight guide that standardizes Storybook docs and story structure for bulk normalization work.

## Files Touched
- Added: `apps/web/docs/guides/storybook-normalization-standard.md`

## Decisions
- Prefer Storybook controls + scenario stories over long-form prose in docs.
- Only include `Variants` when differences are visible/meaningful.
- Exports must render as a table, not bullets.

## Commands
- `date -u +%Y%m%dT%H%M%SZ`

## Verification
- Documentation-only change.

