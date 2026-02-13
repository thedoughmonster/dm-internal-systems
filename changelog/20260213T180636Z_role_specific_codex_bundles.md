Date (UTC): 2026-02-13T18:06:36Z
Scope: root (ops tooling)

Summary of intent:
- Implement per-role Codex context bundles so each role loads shared instructions plus only its role-specific rules.

Files created or modified by this run:
- ops_tooling/scripts/directives/context_bundle.mjs
- ops_tooling/scripts/directives/scripts.test.mjs
- AGENTS.md

Decisions made:
- Added role-aware bundle generation for architect/executor/pair/auditor.
- Added `--all-roles` support for build/check/show to generate and verify all role bundles.
- `bootstrap` and `start` now require/select a role and bind profile to the role-specific bundle.
- Added `dc_role` profile metadata field in managed profile blocks.
- Updated startup guidance so role-specific compiled bundle is authoritative and broad startup rule file scans are disallowed when bundle is active.

Validation performed:
- `ops_tooling/scripts/dc test` (pass: 15/15)

Notes on constraints respected:
- No destructive git operations.
- Scope limited to codex/directive tooling and tests.
