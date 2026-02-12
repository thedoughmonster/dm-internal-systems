# Session Changelog Entry

Date (UTC) and scope:
- 20260211T205537Z
- Scope: Storybook preview preloader behavior in apps/web/.storybook

Summary of intent:
- Hide Storybook's preparing skeleton overlays to avoid visual flashes during docs/component load.

Files created or modified by this run:
- apps/web/.storybook/preview-head.html (modified)
- apps/web/changelog/20260211T205537Z_storybook_hide_preload_skeleton.md (created)

Decisions made:
- Kept existing dark prepaint styling.
- Added explicit display none override for `.sb-preparing-story` and `.sb-preparing-docs`.

Validation performed:
- npm --prefix apps/web run storybook -- --ci --smoke-test (pass)

Risks and followups:
- During loading, users may now see only the background (no skeleton indicator).

Commands run:
- npm --prefix apps/web run storybook -- --ci --smoke-test

Verification:
- Storybook starts successfully with skeleton layers hidden by override CSS.
