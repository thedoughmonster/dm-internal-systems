Date (UTC): 2026-02-03
Scope: directives UI and local directives storage

Summary of intent
- Add a local directives UI at /directives backed by filesystem stored markdown with YAML meta.
- Add local directives storage utilities and types.
- Add /directives to top navigation with a code icon.

Files created or modified
- apps/web/app/directives/actions.ts
- apps/web/app/directives/page.tsx
- apps/web/app/directives/composites/DirectivesView.tsx
- apps/web/app/directives/composites/SessionSelect.tsx
- apps/web/app/directives/composites/FilterSelect.tsx
- apps/web/app/directives/composites/TagsMultiSelect.tsx
- apps/web/app/directives/composites/TaskListInput.tsx
- apps/web/app/directives/lib/directives-store.ts
- apps/web/lib/navigation-registry.ts
- apps/web/app/layout.tsx
- apps/web/types/directives/task.d.ts
- apps/web/package.json
- apps/web/package-lock.json
- apps/web/AGENTS.md
- apps/web/.local/directives/<guid>/README.md (local only)
- apps/web/.local/directives/<guid>/*.md (local only)

Decisions made
- Store directives locally under apps/web/.local/directives/<guid>/ with README.md and TASK_<slug>.md files.
- Each directive file uses YAML front matter with a meta block and short summary.
- UI writes and reads local directives directly as an approved local exception.
- Task meta includes auto_run and session_priority for execution ordering.
- /directives filters use selects for status and directive and a tags multi select.
- Task creation supports multiple summaries and auto-generated titles.
- Directives top nav link is icon only and placed to the right of settings.
- Archived directives are hidden by default unless filtered by status.

Validation performed
- npm --prefix apps/web --cache /tmp/npm-cache install yaml@^2.8.0
- npm --prefix apps/web run typecheck
- npm --prefix apps/web run lint
- npm reported 1 high severity vulnerability in the dependency tree.
- lint reported existing warnings in apps/web/components/ui.

Notes on constraints respected
- No secrets were printed.
- No em dash characters were used.
- ui_style_contract.json and ui_style_contract.md were not modified.
