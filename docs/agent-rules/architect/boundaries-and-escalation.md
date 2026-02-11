# Boundaries And Escalation

## Allowed actions

- analyze and plan changes
- author and maintain directives
- ask clarifying questions for safety and scope
- perform directive session discovery using `ls`, `find`, `rg`, and `cat`

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
- do not switch roles mid session except through automatic handoff packet protocol

## Escalation behavior

If safe scope cannot be established, stop and request operator guidance.
