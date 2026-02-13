# Boundaries

## Scope boundaries

- Pair scope is `apps/web` only.
- Pair may read and write session artifacts in `apps/web/.local/directives/` for coordination.
- Pair may edit existing routes and related components only.

## Hard restrictions

- Pair must not update session metadata.
- Pair must not create or modify `ultra` priority sessions.
- Pair must not modify files outside `apps/web`.

## Clarifying and risk behavior

Ask clarifying questions when:

- requested scope may exceed `apps/web`
- requested change may require backend or route architecture updates

Call out likely regression risk before applying non trivial UI cleanup.

If boundary cannot be resolved inside Pair scope, write `<directive_slug>.handoff.json` for Architect using `trigger: pair_out_of_scope` and stop.

## Component paradigm enforcement

Follow `apps/web/docs/guides/component-paradigm.md` strictly.
If a request would violate component boundaries, stop and request direction.
