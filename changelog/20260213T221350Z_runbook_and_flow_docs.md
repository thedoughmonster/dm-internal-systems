Date (UTC): 2026-02-13T22:13:50Z
Scope: root (directive runbooks + flow documentation)

Summary of intent:
- Add scripted runbook orchestration and document canonical directive session flow in machine-readable JSON.

Files created or modified by this run:
- .directive-cli/scripts/directives/runbook.mjs
- .directive-cli/scripts/directives/bin/runbook
- .directive-cli/scripts/directives/_directive_helpers.mjs
- .directive-cli/scripts/directives/_git_helpers.mjs
- .directive-cli/scripts/directives/repo_map.mjs
- .directive-cli/scripts/directives/directive_start.mjs
- .directive-cli/scripts/directives/task_start.mjs
- .directive-cli/scripts/directives/task_finish.mjs
- .directive-cli/scripts/directives/directive_finish.mjs
- .directive-cli/scripts/directives/bin/repomap
- .directive-cli/scripts/directives/bin/directivestart
- .directive-cli/scripts/directives/bin/taskstart
- .directive-cli/scripts/directives/bin/taskfinish
- .directive-cli/scripts/directives/bin/directivefinish
- .directive-cli/scripts/directives/bin/cli
- .directive-cli/scripts/directives/scripts.test.mjs
- .directive-cli/docs/flows/directive-session-flow.json
- docs/README.md

Decisions made:
- Introduced `runbook` command family with initial runbooks:
  - `executor-task-cycle` (pre/post phases)
  - `executor-directive-closeout`
  - `architect-authoring`
- Added executor lifecycle scripts and repo map helper.
- Added canonical flow JSON under `.directive-cli/docs/flows/` for process standardization.
- Updated CLI help/routing to expose repo/runbook/task/directive lifecycle commands.

Validation performed:
- `dc test` (pass: 20/20)

Notes on constraints respected:
- No destructive git reset/checkout/revert operations used.
- Git actions remain script-owned and metadata-driven.
