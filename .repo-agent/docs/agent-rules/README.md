# Agent Rules Layout

Status: active
Canonical location for role-scoped narrative guidance.
Machine-operational rules are defined in `.directive-cli/policies/*.json` and enforced by lifecycle scripts.

## Layout

- `.directive-cli/docs/agent-rules/shared/`
- `.directive-cli/docs/agent-rules/architect/`
- `.directive-cli/docs/agent-rules/executor/`
- `.directive-cli/docs/agent-rules/pair/`
- `.directive-cli/docs/agent-rules/auditor/`

## Notes

- Role bindings in `AGENTS.md` point to these role entrypoints.
- Procedure precedence: `dc` lifecycle scripts and runbooks are canonical runtime behavior.
- Historical monolithic snapshots are archived under `.archive/docs/agent-rules-monolith/`.
- Handoff protocol review artifact: `.directive-cli/docs/agent-rules/role-handoff-audit.md`.
