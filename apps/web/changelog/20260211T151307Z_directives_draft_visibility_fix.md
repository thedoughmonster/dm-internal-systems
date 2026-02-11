Date (UTC): 2026-02-11T15:13:07Z
Scope: apps/web directives UI and server actions

Summary:
- Fixed directive draft discoverability issues in `/directives` by resetting sticky filters after draft creation, including dynamic status values in filter options, and ordering sessions/tasks by newest updated timestamp.
- Resolved unrelated blocking typecheck issues in directives composites (`id` requirements and unused import).

Files touched:
- `apps/web/app/directives/actions.ts`
- `apps/web/app/directives/composites/DirectivesView.tsx`
- `apps/web/app/directives/composites/SessionCard.tsx`
- `apps/web/app/directives/composites/SessionMetaEditor.tsx`
- `apps/web/app/directives/page.tsx`
- `apps/web/app/directives/session/[sessionId]/page.tsx`
- `apps/web/changelog/20260211T151307Z_directives_draft_visibility_fix.md`

Decisions:
- `createTodo` now redirects to `/directives` after creation to clear stale status/tag query filters that can hide newly created drafts.
- Status filter options now include statuses discovered from directive file metadata, not only static known values.
- Session groups and task rows are sorted by `meta.updated` descending so newly updated/created drafts appear first.
- Forced dynamic rendering for directives routes (`dynamic = "force-dynamic"`, `revalidate = 0`) to prevent stale route-cache behavior from masking freshly written local directive files.
- Kept lint warnings in `TagsInput.tsx` unchanged because they are pre-existing warnings not introduced by this change.

Risks and follow-ups:
- Redirecting after create resets the user’s prior filter context by design; this is intentional to prioritize immediate draft visibility.
- Consider adding a session highlight or deep-link to the newly created `sessionId` in a future pass.

Commands run:
- `rg -n "directives|status|archived|.local/directives" apps/web -S`
- `sed -n '1,260p' apps/web/app/directives/lib/directives-store.ts`
- `sed -n '1,260p' apps/web/app/directives/composites/DirectivesView.tsx`
- `sed -n '1,260p' apps/web/app/directives/actions.ts`
- `npm --prefix apps/web run lint`
- `npm --prefix apps/web run typecheck`
- `git status --short`
- `node -e 'const {createTodoSession}=require(\"./apps/web/app/directives/lib/directives-store.ts\"); ...'`

Verification:
- `npm --prefix apps/web run typecheck` passes.
- `npm --prefix apps/web run lint` passes with 2 pre-existing warnings in `apps/web/app/directives/composites/TagsInput.tsx`.
- New draft-visibility behavior is enforced in code path:
  - create action redirect in `apps/web/app/directives/actions.ts`
  - dynamic status options and updated-time ordering in `apps/web/app/directives/composites/DirectivesView.tsx`.
  - forced dynamic rendering in `apps/web/app/directives/page.tsx` and `apps/web/app/directives/session/[sessionId]/page.tsx`.
