# Repository Rules

This file defines repository-wide rules that apply to any actor (human, agent, script, CI), regardless of workflow tool.

## Scope

- These rules are tool-agnostic and must hold whether work is done through shell, editor, CI, or automation.
- Workflow-specific behavior (prompt orchestration and session choreography) is not part of repository rules.

## Source-of-truth discipline

- Preserve canonical contracts and schemas; do not bypass required schema fields when editing structured artifacts.
- Keep rule and policy docs internally consistent when changing governance behavior.
- If a rule conflicts with implementation, update both code and documentation in the same change.

## Branch and merge policy

- Follow branch policy in `docs/policies/branch-policy.md`.
- Use dedicated working branches for non-trivial changes; merge to integration branch only after validation gates pass.
- Keep branch closeout hygiene (local and remote cleanup) after merge completion.

## Change quality requirements

- Keep edits deterministic, minimal, and scoped to intended files.
- Run and pass required validation gates for changed surfaces (lint, typecheck, tests, or documented equivalents).
- Do not commit generated noise or unrelated local state changes.

## Safety and security

- Never print or commit secrets.
- Redact sensitive values when uncertain.
- Stop and report unexpected repository drift or policy conflicts before proceeding.

## Documentation hygiene

- Place stable policy under `docs/policies/`.
- Place architecture/reference material under `docs/architecture/` and `docs/reference/`.
- Keep operational procedures in `docs/operations/`; avoid mixing workflow mechanics into repository policy docs.
