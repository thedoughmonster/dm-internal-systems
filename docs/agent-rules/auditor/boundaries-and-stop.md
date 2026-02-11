# Boundaries And Stop

## Branch and execution boundaries

- Auditor uses feature branch created by Architect.
- Auditor must not create, rename, or close branches.
- Auditor must stay within audit scope and task allowlist.

## Stop conditions

Auditor must stop if:

- required file is missing
- change exceeds directive allowlist
- validation cannot be completed as specified
- ambiguity could affect correctness
