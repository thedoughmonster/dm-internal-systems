# Session Changelog Entry

Date (UTC) and scope:
- 20260211T214313Z
- Scope: Storybook docs runtime theme configuration in apps/web/.storybook

Summary of intent:
- Prevent docs pages from reverting to default white by setting an explicit Storybook docs theme in preview runtime parameters.

Files created or modified by this run:
- apps/web/.storybook/preview.ts (modified)
- apps/web/changelog/20260211T214313Z_storybook_docs_theme_runtime_override.md (created)

Decisions made:
- Use `storybook/theming` `create()` to define a dark docs theme aligned to app palette.
- Keep existing CSS prepaint/stability overrides in `preview-head.html`.

Validation performed:
- npm --prefix apps/web run lint (pass with existing unrelated warnings in apps/web/app/directives/composites/TagsInput.tsx)
- npm --prefix apps/web run typecheck (pass)
- Verified Storybook dev server on port 6006 serves docs index entries (`DOCS_COUNT=54`, `ui-accordion--docs` present).

Risks and followups:
- Additional docs block selectors may still be needed if future Storybook updates change docs surface class names.

Commands run:
- npm --prefix apps/web run storybook -- --host 0.0.0.0 --ci
- npm --prefix apps/web run lint
- npm --prefix apps/web run typecheck
- curl http://127.0.0.1:6006/index.json

Verification:
- Docs entries are available with runtime docs theme configured.
