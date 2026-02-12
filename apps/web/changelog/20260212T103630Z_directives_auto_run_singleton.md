---
meta:
  date: "2026-02-12T10:36:30Z"
  scope: "apps/web"
  summary: "Move directives auto-run toggle into session header and enforce single auto-run session."
---

## Summary
- Moves the directive session `auto_run` control into the session card header.
- Enforces that only one directive session can have `meta.auto_run: true` at a time.

## Files Touched
- Modified: `apps/web/app/directives/composites/SessionCard.tsx`
- Modified: `apps/web/app/directives/composites/DirectivesView.tsx`
- Added: `apps/web/app/directives/composites/SessionAutoRunToggle.tsx`
- Deleted: `apps/web/app/directives/composites/SessionMetaEditor.tsx`
- Modified: `apps/web/app/directives/lib/directives-store.ts`

## Decisions
- Treat `auto_run` as a session-level setting stored on the session `README.md` only.
- When turning `auto_run` on for a session, automatically turn it off for all other sessions.

## Commands
- `date -u +%Y%m%dT%H%M%SZ`

## Verification
- Pending: `npm --prefix apps/web run typecheck`
- Pending: `npm --prefix apps/web run lint`

