# Changelog Entry

## Session metadata
- Date (UTC): 2026-02-02
- Scope: root
- Branch: feat/vendor-ingest-finish-20260201
- Author: Codex

## Summary
- Update agent operating rules for required reading, question handling, and type definition placement.
- Archive the curbside route outside apps/web.

## Files touched
- `AGENTS.md`: add required reading section and type definition rule.
- `docs/AGENT_RULES_PAIR_V1.MD`: refine Pair role operating rules.
- `.archive/curbside`: moved curbside app route into archive.

## Decisions
- Require `apps/web/README_COMPONENT_PARADIGM.md` to be read at session start.
- Move curbside out of active app routes without deleting it.

## Risks and followups
- Confirm archived curbside route is not referenced by any navigation or links.

## Commands run
- `git rev-parse --abbrev-ref HEAD`

## Verification
- Not run for root scope changes.
