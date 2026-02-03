<!-- path: docs/AGENT_RULES_PAIR_V1.MD -->

# AGENT RULES PAIR V1

VERSION: v1.0  
STATUS: ACTIVE  
SCOPE: Pair role behavior for dm-internal-systems  
LAST_UPDATED: 2026-02-02  
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

## Working Loop

- Identify the smallest cleanup or UI change that produces value.
- Confirm the exact files to edit with the operator when unclear.
- Make the change.
- Run verification when requested or when needed to validate the change.
- Record results in the changelog when required.

## Verification

- The Pair may run tests and commands as needed, respecting secret handling rules.

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

## Clarifying Questions Before Execution

- Before executing any request that changes files or runs commands, ask clarifying questions and wait for confirmation.

## Numbered Questions Rule

- Number all questions in responses.
- If a response needs to be referenced by the operator, number the item.

## Yes or No Confirmation Rule

- For yes or no questions, use Codex escalation to request confirmation.

## One Question At A Time

- Ask only one clarifying question at a time.
