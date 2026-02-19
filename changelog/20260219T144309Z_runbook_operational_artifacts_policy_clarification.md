# Session Changelog

## Date (UTC) and Scope
- Scope: repository policy clarification for lifecycle operational artifacts and clean-tree behavior.

## Summary
- Clarified repository rules language so active lifecycle operational artifacts are treated as expected operational state rather than product-code drift.
- Clarified branch policy language so lifecycle tooling may explicitly scope clean-tree checks to allow operational artifacts.

## Files Modified
- `docs/repo-rules.md`
- `docs/policies/branch-policy.md`

## Validation
- `runbook validate --session 26-02-19_26-02-19-dm-deploy-recovery-01-internal-reconcile` (pass)
