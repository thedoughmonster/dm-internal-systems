# Session Changelog Entry

Date (UTC) and scope:
- 20260211T212710Z
- Scope: Storybook docs availability and preload visual stability in apps/web

Summary of intent:
- Resolve missing docs behavior by enabling docs addon explicitly and reduce preload blink without suppressing docs rendering.

Files created or modified by this run:
- apps/web/.storybook/main.ts (modified)
- apps/web/.storybook/preview-head.html (modified)
- apps/web/package.json (modified)
- apps/web/package-lock.json (modified)
- apps/web/changelog/20260211T212710Z_storybook_docs_addon_and_preload_stabilization.md (created)

Decisions made:
- Added `@storybook/addon-docs` to Storybook addons.
- Installed `@storybook/addon-docs@^10.2.8` as dev dependency.
- Kept docs wrappers visible and made preload layers non-interactive with opacity zero.
- Disabled loader/skeleton animations instead of hard-hiding docs wrappers.

Validation performed:
- npm --prefix apps/web run lint (pass with existing unrelated warnings in apps/web/app/directives/composites/TagsInput.tsx)
- npm --prefix apps/web run typecheck (pass)
- npm --prefix apps/web run storybook -- --ci --smoke-test (pass)
- npm --prefix apps/web run storybook:build:ci (pass)
- Verified built index contains docs entries including `ui-accordion--docs` and `ui-button--docs`.

Risks and followups:
- Browser cache can still show stale Storybook manager assets after addon changes; hard refresh may be required.

Commands run:
- npm_config_cache=/tmp/npm-cache npm --prefix apps/web install -D @storybook/addon-docs@^10.2.8
- npm --prefix apps/web run lint
- npm --prefix apps/web run typecheck
- npm --prefix apps/web run storybook -- --ci --smoke-test
- npm --prefix apps/web run storybook:build:ci

Verification:
- Docs entries are generated and index-verified in Storybook static output.
