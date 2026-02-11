# Environment Setup

## Canonical Local Secret Source Files

- `.env.test.local` is the canonical source file for local and preview or development test-scoped values.
- `.env.prod.local` is the canonical source file for production-scoped values.

## Local Runtime

- Before running the local app, copy `.env.test.local` to `.env.local`.
- Command: `cp .env.test.local .env.local`

## Operator Action Required

- Create real `.env.test.local` and `.env.prod.local` files locally before any sync tasks run.
- Do not commit local env files.

## Vercel CLI Sync Commands

- Prerequisite: run `ops_tooling/scripts/env/check-local-secret-files.sh` before any sync command.
- Preview scope from test source file:
  - `ops_tooling/scripts/env/sync-vercel-env.sh --scope preview --source-file .env.test.local`
- Development scope from test source file:
  - `ops_tooling/scripts/env/sync-vercel-env.sh --scope development --source-file .env.test.local`
- Production scope from prod source file:
  - `ops_tooling/scripts/env/sync-vercel-env.sh --scope production --source-file .env.prod.local`
