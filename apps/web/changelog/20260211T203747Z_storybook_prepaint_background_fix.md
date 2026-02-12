# Session Changelog Entry

Date (UTC) and scope:
- 20260211T203747Z
- Scope: Storybook shell and preview prepaint behavior in `apps/web/.storybook`

Summary of intent:
- Eliminate the initial white flash by applying dark surface styles before Storybook preview and manager UI hydration.

Files created or modified by this run:
- `apps/web/.storybook/preview-head.html` (created)
- `apps/web/.storybook/manager-head.html` (created)
- `apps/web/changelog/20260211T203747Z_storybook_prepaint_background_fix.md` (created)

Decisions made:
- Apply immediate fallback background and foreground color in Storybook head files.
- Set `color-scheme: dark` at document start for preview.
- Keep existing `preview.ts` decorator and globals behavior unchanged.

Validation performed:
- `npm --prefix apps/web run storybook -- --ci --smoke-test` (pass)

Risks and followups:
- If theme tokens are changed later, these fallback values may need updates.

Commands run:
- `npm --prefix apps/web run storybook -- --ci --smoke-test`

Verification:
- Storybook startup completed with new prepaint files loaded in configuration paths.
