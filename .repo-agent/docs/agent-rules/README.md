> Legacy notice: This file belongs to the archived pre-runbook ruleset. It is not authoritative for current sessions. Use `.repo-agent/AGENTS.md`, `docs/repo-rules.md`, and `.runbook/instructions/*.md`.

# Agent Rules Layout

Status: legacy (not authoritative for current runbook flow)

This directory is retained as historical reference only.
Do not treat files under `.repo-agent/docs/agent-rules/**` as active runtime instructions.

Current authoritative sources:
- `.repo-agent/AGENTS.md`
- `docs/repo-rules.md`
- `.runbook/instructions/*.md`
- `.runbook/scripts/runbook_cli.mjs`

## Layout

- `.repo-agent/docs/agent-rules/shared/`
- `.repo-agent/docs/agent-rules/architect/`
- `.repo-agent/docs/agent-rules/executor/`
- `.repo-agent/docs/agent-rules/pair/`
- `.repo-agent/docs/agent-rules/auditor/`

## Notes

- Legacy role narratives are preserved for migration reference.
- Procedure precedence for active sessions is defined by `runbook` and `.runbook/instructions/*.md`.
- Historical monolithic snapshots are archived under `.archive/docs/agent-rules-monolith/`.
- Handoff protocol review artifact: `.repo-agent/docs/agent-rules/role-handoff-audit.md`.
