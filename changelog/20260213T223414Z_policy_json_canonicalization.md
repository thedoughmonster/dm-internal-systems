# Session Changelog

## Date (UTC) and Scope
- Date: 2026-02-13T22:34:14Z
- Scope: `.directive-cli` policy layer, lifecycle enforcement, CLI routing/help, context bundle sources, rule-doc entrypoint normalization.

## Summary of Intent
- Move machine-operational behavior to versioned JSON policy files.
- Keep markdown as thin entrypoint/reference guidance.
- Enforce policy at runtime from lifecycle scripts.

## Files Created or Modified
- Added `.directive-cli/policies/core.policy.json`
- Added `.directive-cli/policies/executor.lifecycle.policy.json`
- Added `.directive-cli/policies/architect.authoring.policy.json`
- Added `.directive-cli/policies/handoff.schema.json`
- Added `.directive-cli/policies/runbook.flow.json`
- Added `.directive-cli/scripts/directives/_policy_helpers.mjs`
- Added `.directive-cli/scripts/directives/validate_policies.mjs`
- Added `.directive-cli/scripts/directives/bin/validatepolicies`
- Modified `.directive-cli/AGENTS.md`
- Modified `.directive-cli/docs/agent-rules/README.md`
- Modified `.directive-cli/docs/agent-rules/architect/README.md`
- Modified `.directive-cli/docs/agent-rules/executor/README.md`
- Modified `.directive-cli/docs/agent-rules/pair/README.md`
- Modified `.directive-cli/docs/agent-rules/auditor/README.md`
- Modified `.directive-cli/scripts/directives/_directive_helpers.mjs`
- Modified `.directive-cli/scripts/directives/directive_start.mjs`
- Modified `.directive-cli/scripts/directives/task_start.mjs`
- Modified `.directive-cli/scripts/directives/task_finish.mjs`
- Modified `.directive-cli/scripts/directives/directive_finish.mjs`
- Modified `.directive-cli/scripts/directives/runbook.mjs`
- Modified `.directive-cli/scripts/directives/context_bundle.mjs`
- Modified `.directive-cli/scripts/directives/bin/cli`
- Modified `.directive-cli/scripts/directives/scripts.test.mjs`
- Modified `docs/README.md`

## Decisions Made
- Canonical operational rules now live under `.directive-cli/policies/*.json`.
- Runtime enforcement added to directive/task lifecycle scripts by policy loader.
- `dc policy validate` added as explicit policy integrity check.
- Context bundle now includes policy JSON content by default.
- AGENTS entrypoint kept concise and points to policy files + script-owned flow.

## Validation Performed
- `dc policy validate --verbose` (pass)
- `dc test` (pass, 21/21)
- `dc help` (policy category visible)

## Notes on Constraints Respected
- No manual frontmatter edits introduced.
- No destructive git operations used.
- Tooling remains under `.directive-cli` per current operational direction.
