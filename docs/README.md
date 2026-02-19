# Docs Directory Map

This directory is organized by purpose.

## Active sections
- `docs/repo-rules.md`: canonical tool-agnostic repository rules (applies to all actors and tooling).
- `docs/policies/`: canonical repository policy set (branching, deployment safety, validation, contracts, docs/changelog, env/secrets).
- `docs/policies/engineering/`: codebase consistency standards (architecture boundaries, naming, quality, contracts, DB, UI, observability, validation, DoD).
- `.repo-agent/AGENTS.md`: canonical agent charter entrypoint for this repository.
- `docs/architecture/`: system and deployment architecture references.
- `docs/operations/`: operational procedures and status docs.
- `docs/policies/`: cross-cutting policy docs.
- `docs/reference/`: domain references used by people and tooling.
- `docs/audits/`: current audit snapshots.

## Related locations outside docs
- `contracts/`: machine-consumed JSON contracts and schemas.
- `.archive/docs/`: archived and deprecated governance artifacts.
- `.archive/docs/docs-audits/`: historical docs audit snapshots.
- `.archive/docs/agent-rules-monolith/`: archived monolithic agent rule snapshots.
- `~/.runbook-state/`: external runbook directive/log state (outside repo).
- Global runbook CLI: user-installed package binary (`runbook` on PATH).

## Notes
- Role bindings and startup behavior are defined in `.repo-agent/AGENTS.md`.
- UI paradigm required reading pointer is `apps/web/docs/guides/component-paradigm.md`.
