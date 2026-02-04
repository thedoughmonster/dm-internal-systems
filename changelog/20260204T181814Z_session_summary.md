Date (UTC): 2026-02-04
Scope: agent guidance and directive rules

Summary:
- Archived versioned agent rule files and introduced prime agent rule filenames without V1 suffixes.
- Updated references to the new agent rule filenames.
- Removed web UI ruleset bindings from agent guidance files.
- Added or refined startup and metadata handling requirements for Architect and Executor roles.
- Removed VERSION and LAST_UPDATED fields from prime agent rule files.
- Required feature branches for Pair and Executor work and tuned Executor confirmation for auto run.
- Required Architect owned feature branches and branch name recording in session README meta.
- Restricted session metadata updates to the Architect, with Executor limited to task result updates.
- Added Auditor role with ultra priority auto run behavior and updated role bindings.
- Forced ultra priority sessions to bypass to Executor and required Auditor to prompt for Executor mode on completion.

Files created or modified:
- `AGENTS.md`
- `docs/AGENT_RULES_ARCHITECT.MD`
- `docs/AGENT_RULES_EXECUTOR.MD`
- `docs/AGENT_RULES_WEB_UI.MD`
- `docs/AGENT_RULES_PAIR.MD`
- `docs/AGENT_RULES_AUDITOR.MD`
- `docs/agents-archive/AGENT_RULES_ARCHITECT_20260204.MD`
- `docs/agents-archive/AGENT_RULES_EXECUTOR_20260204.MD`
- `docs/agents-archive/AGENT_RULES_WEB_UI_20260204.MD`
- `docs/agents-archive/AGENT_RULES_PAIR_20260204.MD`
- `apps/web/AGENTS.md`
- `apps/web/README_COMPONENT_PARADIGM.md`

Decisions made:
- Agent rule filenames are now prime files without version suffixes, with date versioning stored in `docs/agents-archive/`.
- Agent rule edits require archiving the current prime file before updating it.

Validation performed:
- None.

Commands run:
- `mkdir -p docs/agents-archive`
- `cp docs/AGENT_RULES_ARCHITECT_V1.MD docs/agents-archive/AGENT_RULES_ARCHITECT_20260204.MD`
- `cp docs/AGENT_RULES_EXECUTOR_V1.MD docs/agents-archive/AGENT_RULES_EXECUTOR_20260204.MD`
- `cp docs/AGENT_RULES_WEB_UI_V1.MD docs/agents-archive/AGENT_RULES_WEB_UI_20260204.MD`
- `cp docs/AGENT_RULES_PAIR_V1.MD docs/agents-archive/AGENT_RULES_PAIR_20260204.MD`
- `mv docs/AGENT_RULES_ARCHITECT_V1.MD docs/AGENT_RULES_ARCHITECT.MD`
- `mv docs/AGENT_RULES_EXECUTOR_V1.MD docs/AGENT_RULES_EXECUTOR.MD`
- `mv docs/AGENT_RULES_WEB_UI_V1.MD docs/AGENT_RULES_WEB_UI.MD`
- `mv docs/AGENT_RULES_PAIR_V1.MD docs/AGENT_RULES_PAIR.MD`

Notes on constraints respected:
- No em dash characters used.
- Secrets were not printed.
