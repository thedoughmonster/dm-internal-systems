Date (UTC): 2026-02-03
Scope: root config and agent guidance updates

Summary of intent
- Align agent guidance with the new local directives storage model and local directives UI exception.
- Ignore local directives data in git.

Files created or modified
- .gitignore
- AGENTS.md
- docs/AGENT_RULES_ARCHITECT_V1.MD
- docs/AGENT_RULES_EXECUTOR_V1.MD
- docs/AGENT_RULES_PAIR_V1.MD
- apps/web/types/directives/task.d.ts
- apps/web/app/directives/lib/directives-store.ts

Decisions made
- Directive sessions live under apps/web/.local/directives/<guid>/ with README.md and TASK_<slug>.md files.
- /directives UI reads and writes local directive data directly as an approved local exception.
- QOL exception notes should be recorded in the session README notes section.

Validation performed
- npm --prefix apps/web run typecheck
- npm --prefix apps/web run lint
- lint reported existing warnings in apps/web/components/ui.

Notes on constraints respected
- No secrets were printed.
- No em dash characters were used.
