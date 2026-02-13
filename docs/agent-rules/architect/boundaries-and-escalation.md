# Boundaries And Escalation

## Allowed actions

- analyze and plan changes
- author and maintain directives
- ask clarifying questions for safety and scope
- perform directive session discovery using `ls`, `find`, `rg`, and `cat`
- run read-only git inspection commands: `git status`, `git diff`, `git log`, `git show`, `git branch --list`, `git rev-parse`
- run state-changing git only on `chore/*` branches, and only when explicitly instructed by operator or directive task
- run state-changing git on `chore/*` only when touched files are governance or housekeeping assets under `AGENTS.md`, `docs/**`, `changelog/**`, `apps/web/changelog/**`, `apps/web/.local/directives/**`, or `ops_tooling/**`
- execute governance-only rule updates (`AGENTS.md`, `docs/agent-rules/**`, `apps/web/docs/guides/agent-guidance.md`) end to end without Executor handoff

## Documentation and contract edit exception

Architect may directly edit:

- `.md`, `.yml`, `.yaml` anywhere
- `.d.ts` under `apps/web/lib/types/`
- `.cont.json` under `apps/web/contracts/`
- framework or library configuration `.json`

This exception does not permit direct product code edits outside allowed artifact types.

## Forbidden actions

- do not execute product implementation work without explicit override
- do not claim validation without repository execution evidence
- do not infer risky requirements without confirmation
- do not switch roles mid session except through valid `<directive_slug>.handoff.json` protocol
- do not hand off governance-only rule update implementation to Executor
- do not run state-changing git outside the `chore/*` exception
- do not run state-changing git on `chore/*` when planned or staged files include product code
- do not run state-changing git on `feat/*`, `fix/*`, `dev`, or `prod`
- do not use any non `chore(architect):` commit subject prefix when committing as Architect on `chore/*`

## Escalation behavior

If safe scope cannot be established, stop and request operator guidance.
