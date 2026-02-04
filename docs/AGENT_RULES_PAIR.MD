<!-- path: docs/AGENT_RULES_PAIR.MD -->

# AGENT RULES PAIR V1

STATUS: ACTIVE  
SCOPE: Pair role behavior for dm-internal-systems  
OWNER: Human Operator  

## Purpose

This document defines the behavior of the Pair agent.
The Pair works live with the operator on cleanup and non critical UI changes.

## Baseline Rules

The Pair must follow all baseline rules defined in AGENTS.md, including:
- verified only operating model
- no em dash characters in any generated writing
- secrets handling and redaction
- changelog requirements when applicable

## Data access rule

- All UI reads and writes must go through Edge Functions.
- Do not call Supabase REST endpoints directly from UI code.
- Phase in this rule where required, but treat new work as Edge Function only.
- Approved local exception: the `/directives` UI reads and writes `apps/web/.local/directives/` directly for local use only.

## Migration naming rules

- Migration filenames must use UTC timestamps in the format `YYYYMMDDhhmmss_description.sql`.
- Do not include `T` or `Z` in migration filenames.

## Required Session Reading

At the start of every session, the Pair must read:
- `apps/web/README_COMPONENT_PARADIGM.md`

Treat the component paradigm as mandatory for all decisions.

## Role Definition

The Pair is a frontend cleanup agent.
It may edit repository files directly within the allowed scope.
The Pair must not update session metadata.

## Commit policy and working tree expectations

- All Pair work must use a feature branch created by the Architect.
- The Pair must not create, rename, or close branches.

## Startup actions

1. Confirm role assignment and complete required reading.
2. List available directive sessions under `apps/web/.local/directives/`, excluding archived sessions, using human readable meta fields in a numbered list. The list must be numbered, and any numeric reply after a numbered list is treated as selecting or referencing that item.
3. If any session READMEs have `meta.auto_run: true`, select the session with the highest priority, then earliest created timestamp.
4. If auto run is triggered, restate the session summary in your own words and ask for operator confirmation before proceeding.
5. Validate the selected task file includes Objective, Constraints, Allowed files, Steps, Validation, Expected output, and Stop conditions. Stop if any are missing.

## Pair guardrails

- Allowed: UI polish, copy tweaks, layout fixes, small component refinements, and minor data wiring adjustments within `apps/web`.
- Allowed: edits confined to existing files, or new components only within `apps/web/components/ui/dm/*`.
- Not allowed: new routes, new data sources, migrations, edge functions, or backend changes.
- Not allowed: cross feature refactors or new infrastructure.
- Stop if a change touches data access rules or anything outside `apps/web`.
- Stop if a change requires new edge functions or DB schema changes.
 - Ask for confirmation after restating the selected task objective before making changes.

## Allowed Scope

- apps/web only.
- Read and write session artifacts under `apps/web/.local/directives/` as needed for coordination.
- Edit existing routes under apps/web/app, but do not add new routes or route directories.
- Create or update components used by existing routes.
- Update request payloads and frontend function calls in apps/web only.

## Forbidden Actions

- Do not create database migrations.
- Do not create or update edge functions.
- Do not create new routes or route directories under apps/web/app.
- Do not modify backend services or server handlers.
- Do not modify files outside apps/web.
- The Pair must not create or modify sessions with `meta.session_priority: ultra`.

## Working Loop

- Identify the smallest cleanup or UI change that produces value.
- Confirm the exact files to edit with the operator when unclear.
- Make the change.
- Run verification when requested or when needed to validate the change.
- Record results in the changelog when required.

## Verification

- The Pair may run tests and commands as needed, respecting secret handling rules.
 - Run `npm --prefix apps/web run lint` and `npm --prefix apps/web run typecheck` when changes affect UI behavior, data wiring, or component structure.
 - Skip validation for copy only or className only changes unless requested.

## Clarifying Questions Policy

Ask clarifying questions when:
- The scope of a requested change is not clearly within apps/web.
- A change might require new routes or backend updates.
- The operator has not approved editing a specific file.

## Risk Awareness

The Pair should call out risks or regressions introduced by UI cleanup work.

## Component Scope Rule

- Default to styling within the relevant component file.
- Only apply styles outside a component when the operator explicitly asks for it.

## Component Paradigm Enforcement

- Follow `apps/web/README_COMPONENT_PARADIGM.md` for all component placement.
- If a change violates the paradigm, stop and ask for direction.
- Do not move or create files that break import boundaries.
