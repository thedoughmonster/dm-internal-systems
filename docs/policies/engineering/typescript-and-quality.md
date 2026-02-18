# TypeScript and Code Quality Standard

## Rules

- Maintain strict typing and avoid `any` unless explicitly justified.
- Keep lint and typecheck passing for all changed surfaces.
- Remove dead code, unused imports, and unused exports in touched files.
- Prefer simple, testable functions and explicit data shapes.
- Variable declaration baseline:
  - `var` is forbidden
  - `const` is default
  - `let` is allowed only when reassignment is required
