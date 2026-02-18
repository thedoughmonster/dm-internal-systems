# Repo Rules Boundary Audit (2026-02-18)

## Objective

Ensure only true repository rules are injected as the repository rules bundle, and keep runbook workflow rules separate.

## Decision rule used

A file is a repository rule only if it applies regardless of actor or tool.

## Classification

- `docs/repo-rules.md`: repository rule source (tool-agnostic)
- `docs/policies/branch-policy.md`: repository rule source (branch/merge policy)
- `.repo-agent/AGENTS.md`: runbook/agent runtime charter (not repository-rule bundle)
- `.runbook/instructions/*.md`: runbook workflow rules (not repository-rule bundle)
- `.repo-agent/docs/agent-rules/**`: legacy rule set (not authoritative)
- `docs/architecture/**`: architecture reference (not rules)
- `docs/reference/**`: domain reference (not rules)
- `docs/operations/**`: operational procedures/templates (not repository-rule bundle)
- `docs/audits/**`: audit records (not rules)

## Injection boundary (implemented)

Runbook prompt repository-rules bundle now includes only:

1. `docs/repo-rules.md`
2. `docs/policies/branch-policy.md`

Runbook phase instructions remain separate and continue to define workflow behavior.

## Result

Repository-rule injection is now constrained to tool-agnostic policy docs only.
