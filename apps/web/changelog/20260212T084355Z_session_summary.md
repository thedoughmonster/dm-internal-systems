Date (UTC): 2026-02-12T08:43:55Z
Scope: apps/web directives UI

## Summary

Make the `/directives` UI effectively read-only except for toggling `meta.auto_run` on session README files, and reduce incidental header clutter.

## Files touched

- apps/web/app/directives/actions.ts
- apps/web/app/directives/lib/directives-store.ts
- apps/web/app/directives/composites/DirectivesView.tsx
- apps/web/app/directives/composites/SessionCard.tsx
- apps/web/app/directives/composites/SessionMetaEditor.tsx

## Decisions

- Keep directive task/session content as file-backed and locally editable, but remove in-UI editing of titles, summaries, tags, relations, statuses.
- Retain a single sanctioned mutation in the UI: session `meta.auto_run`.

## Risks / Followups

- `createTodo` / `updateTodo` actions still exist for potential future use, but are not reachable from the UI after removing the create/edit surfaces.

## Commands run

- npm --prefix apps/web run lint
- npm --prefix apps/web run typecheck

## Verification

- Typecheck passes.
- Lint has no errors (2 pre-existing hook dependency warnings in `apps/web/app/directives/composites/TagsInput.tsx`).

