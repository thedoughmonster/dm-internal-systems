# Session Changelog Entry

Date (UTC) and scope:
- 20260211T204712Z
- Scope: Storybook prepaint behavior in apps/web/.storybook

Summary of intent:
- Remove body transition during Storybook startup to prevent quick white/background flash.
- Override Storybook docs preloader surfaces and loader colors to eliminate white skeleton flashes.

Files created or modified by this run:
- apps/web/.storybook/preview-head.html (modified)
- apps/web/.storybook/manager-head.html (modified)
- apps/web/changelog/20260211T204712Z_storybook_body_transition_disable.md (created)

Decisions made:
- Keep prepaint dark background styles.
- Add body transition override at head level for both preview and manager.
- Override `.sb-preparing-story`, `.sb-preparing-docs`, `.sb-previewBlock`, `.sb-argstableBlock`, and `.sb-loader` to dark theme values.

Validation performed:
- npm --prefix apps/web run storybook -- --ci --smoke-test (pass)

Risks and followups:
- If future theming relies on body transitions, storybook-only overrides may need revisiting.

Commands run:
- npm --prefix apps/web run storybook -- --ci --smoke-test

Verification:
- Storybook startup passes with transition override in place.
