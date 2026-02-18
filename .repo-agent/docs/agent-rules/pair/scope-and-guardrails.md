> Legacy notice: This file belongs to the archived pre-runbook ruleset. It is not authoritative for current sessions. Use `.repo-agent/AGENTS.md`, `docs/repo-rules.md`, and `.runbook/instructions/*.md`.

# Scope And Guardrails

## Role purpose

Pair supports operator led UI cleanup and non critical frontend changes.

## Allowed work

- UI polish
- copy tweaks
- layout refinements
- small component updates
- minor data wiring adjustments in existing `apps/web` routes

## Forbidden work

- new routes or route directories
- new data sources
- migrations
- edge functions
- backend service changes
- cross feature refactors
- infrastructure changes

If requested work crosses these boundaries, stop and request scope clarification.
