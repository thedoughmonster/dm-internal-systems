Date (UTC): 2026-02-13T16:33:00Z
Scope: root / ops_tooling directive script test coverage and short command wiring

Summary of intent:
- Add directive script test coverage for CLI smoke, failure paths, and non-dry-run integration flow.
- Add `dc test` routing so directive tooling tests run from the short command.
- Fix validator `--file` session resolution to use the correct session directory depth.

Files created or modified by this run:
- package.json
- ops_tooling/scripts/directives-cli
- ops_tooling/scripts/dc
- ops_tooling/scripts/testdirectives
- ops_tooling/scripts/directives/scripts.test.mjs
- ops_tooling/scripts/directives/validate_directives_frontmatter.mjs
- changelog/20260213T163300Z_directives_script_tests_and_dc_test.md

Decisions made:
- Keep script tests lightweight using Node built-in test runner (`node:test`).
- Cover real create/update/handoff/validate integration with cleanup in test fixture session directories.
- Expose tests through existing short command surface (`dc test`) instead of requiring direct npm invocation.

Validation performed:
- npm run test:directives-scripts
- ops_tooling/scripts/dc test
- ops_tooling/scripts/directives-cli help
- ops_tooling/scripts/directives-cli validate --strict --verbose

Notes on constraints respected:
- Kept scope limited to directive tooling and script tests.
- Did not revert unrelated changes.
