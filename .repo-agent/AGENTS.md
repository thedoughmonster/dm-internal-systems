# DM Internal Systems - Agent Charter (Runbook)

This repository uses `runbook` as the operational control plane.
Do not use legacy `dc` commands.

## Core rules

- Use `runbook` commands for lifecycle operations.
- If command usage is uncertain, run `runbook --help` or `<group> --help` first.
- Before commands or edits, confirm operator intent and explicit go-ahead.
- Treat runbook phase/subphase as hard scope boundaries.
- If blocked by scope, report the exact blocking condition and next valid runbook command.

## Authoring and execution boundaries

- Discovery and authoring are artifact-focused; avoid product-code changes unless phase explicitly allows it.
- Executor phases may implement code only after runbook start gates pass.
- Prefer deterministic, minimal changes and validate with `runbook validate` plus task-required checks.

## Source of truth

- Phase instructions: `.runbook/instructions/*.md`
- Runbook CLI: `.runbook/scripts/runbook_cli.mjs`
- Directive artifacts: `.runbook/directives/<session>/`

If docs conflict with script behavior, `runbook` script behavior wins.
