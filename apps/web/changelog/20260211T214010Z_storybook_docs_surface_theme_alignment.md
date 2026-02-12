# Session Changelog Entry

Date (UTC) and scope:
- 20260211T214010Z
- Scope: Storybook docs surface theming in apps/web/.storybook

Summary of intent:
- Align Storybook docs page background and text surfaces with app theme colors so docs do not render on default white surfaces.

Files created or modified by this run:
- apps/web/.storybook/preview-head.html (modified)
- apps/web/changelog/20260211T214010Z_storybook_docs_surface_theme_alignment.md (created)

Decisions made:
- Theme `#storybook-docs` and `.sbdocs*` containers to app dark background/foreground.
- Theme docs table surfaces and borders to app card/border tones.
- Keep existing preload stabilization and animation suppression.

Validation performed:
- Confirmed server serves themed selectors in `iframe.html?path=/docs/ui-accordion--docs`.
- npm --prefix apps/web run lint (pass with existing unrelated warnings in apps/web/app/directives/composites/TagsInput.tsx)
- npm --prefix apps/web run typecheck (pass)

Risks and followups:
- Some addon-specific doc blocks may require additional selectors if future Storybook versions rename classes.

Commands run:
- curl http://127.0.0.1:6006/iframe.html?path=/docs/ui-accordion--docs
- npm --prefix apps/web run lint
- npm --prefix apps/web run typecheck

Verification:
- Docs theming selectors and values are present in served Storybook iframe head output.
