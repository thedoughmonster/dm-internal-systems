# DM Internal Systems – Deployment Model

## Purpose
This document defines how DM Internal Systems is developed, tested, and deployed safely as a single-repo system with multiple environments. It exists to prevent accidental production changes, enable AI-assisted development, and provide enterprise-grade guardrails without slowing progress.

This document is normative. Deviations should be intentional and documented.

---

## Environment Model

There are three environments. They are defined by **deployment target and secrets**, not by branches.

### 1) Local Development
- Runs on a developer machine
- Used for active coding and experimentation
- Points to the Supabase **test** project
- Uses `.env.local` for configuration

### 2) Staging / Preview
- Automatically created by Vercel for every Pull Request
- Each PR gets its own Preview URL
- Runs only the code from that PR
- Points to the Supabase **test** project
- Used to validate real deployments without risk

### 3) Production
- Deployed only from the `main` branch
- Uses the Supabase **prod** project
- Real data, real users, real side effects

**Key rule:**
Local and Preview share test infrastructure. Production is isolated and touched only by explicit release actions.

---

## Supabase Projects

Two Supabase projects are authoritative:

- `dm_brain_test`
  - Used by local development
  - Used by all Vercel Preview deployments
  - Used by automated tests

- `dm_brain_prod`
  - Used only by production deployments
  - Never used for testing

No environment other than Production is allowed to point at `dm_brain_prod`.

---

## Repository and Branching Strategy

- Single repository
- Single long-lived branch: `main`
- Feature work happens on short-lived branches
- Branches do **not** represent environments

### Pull Requests
- All non-trivial changes must go through a PR
- Opening a PR triggers a Vercel Preview deployment
- Merging a PR into `main` is the only way to deploy to production

---

## Deployment Responsibilities

### Application (Next.js)
- Hosted on Vercel
- Preview deployments for PRs
- Production deployment on merge to `main`

### Database and Edge Functions (Supabase)
- Managed via Supabase CLI
- Migrations and functions are deployed via custom scripts
- Scripts always target **test first**, then **prod**

---

## Supabase Deployment Order

All releases must follow this order:

1) Push database migrations to `dm_brain_test`
2) Deploy edge functions to `dm_brain_test`
3) Run integration tests against `dm_brain_test`
4) Only if tests pass:
   - Push database migrations to `dm_brain_prod`
   - Deploy edge functions to `dm_brain_prod`

Production is never updated unless test passes.

---

## Environment Variables

The codebase is environment-agnostic. Behavior is controlled entirely by environment variables.

### Required variables (examples)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY` (server-only)

### Variable scoping
- Local: `.env.local` (test values)
- Vercel Preview: test values
- Vercel Production: prod values

Secrets are never committed to git.

---

## Testing Model

### Purpose
Tests exist to catch data integrity and business logic regressions that linting and types cannot.

### Strategy
- Integration tests run against `dm_brain_test`
- Tests use known inputs and assert exact database outcomes
- Tests focus on high-risk workflows (ingestion, idempotency, state transitions)

### Prohibitions
- Tests must never run against production
- No automated process may mutate `dm_brain_prod` outside a release

---

## AI Agent (Codex) Rules

AI agents are constrained contributors, not release authorities.

### Allowed
- Create branches
- Commit changes
- Open Pull Requests

### Forbidden
- Push to `origin/main`
- Merge Pull Requests
- Deploy to production

AI output is reviewed through behavior (tests + preview), not manual diff auditing.

---

## Release Authority

The human operator is the sole release authority.

A release happens only when:
- A PR is merged into `main`
- Production deploys occur automatically after merge

No other path to production exists.

---

## Mental Model Summary

- Local: build and experiment
- PR Preview: validate real deployment
- Main: production

**Local → PR Preview → Main = Production**

Agents propose. Tests verify. Humans approve.