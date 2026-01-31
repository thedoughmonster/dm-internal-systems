# DM Internal Systems Codebase Summary (read-only)

## 1) Purpose and scope
- Defines a verified only workflow for canonical documents, including lifecycle rules and enforcement.
- Stores canonical actor model and actor instances as JSON with companion Markdown explanations.
- Provides Supabase Postgres schema and migrations for SOP documents and versions.
- Includes scripts and workflows to apply updates, validate schemas, and generate repo context.
- Hosts a starter Next.js web app under `apps/web`.
- Uses update inbox packages and applied logs to move artifacts into governed locations.

## 2) Tech stack and runtime surfaces
- Next.js 16.1.3 with React 19.2.3 and TypeScript 5 for `apps/web`.
- Node 20 used in CI workflows; Python 3.11 used for validation and update automation.
- Supabase Postgres for data storage with SQL migrations and optional local Supabase CLI config.
- GitHub Actions for automation, validation, and update application.
- Package manager: npm with `apps/web/package-lock.json` present.

## 3) Directory map
- `.github/`: GitHub Actions workflows for database operations, repo context, validation, and update application.
- `apps/`: Next.js web app scaffolding in `apps/web` with App Router and default styles.
- `ops_tooling/db/`: SQL migrations and query files for the `dm` schema and SOP document tables.
- `docs/`: Document lifecycle authority files plus lifecycle governed and exempt document roots.
- `ops_tooling/scripts/`: Helper scripts for validation and repo context generation.
- `supabase/`: Local Supabase configuration and SQL migrations for remote schema sync.
- `ops_tooling/updates/`: Actor intake payloads for validation.
- `ops_tooling/workflows/updates-inbox/`: Inbox, applied logs, scripts, and docs for update package processing.

## 4) How the system runs
- Web app development uses `npm run dev` in `apps/web` with `next dev`.
- Database migrations are applied via GitHub Actions workflows using `psql` against Supabase.
- Update packages are applied by `ops_tooling/workflows/updates-inbox/scripts/updates_apply.py` or `ops_tooling/workflows/updates-inbox/scripts/dm_updates_apply.sh` using `ops_tooling/workflows/updates-inbox/inbox` zip files.
- Actor intake validation and append runs via `ops_tooling/scripts/actors_append_validated.py`.
- Repo context updates use `ops_tooling/scripts/generate_repo_context.mjs` in CI.
- Example SOP seeding uses `ops_tooling/scripts/seed_example_sop.mjs` with `SUPABASE_DB_URL`.

## 5) CI and automation
### `.github/workflows/db_migrate.yml`
- Triggers: `workflow_dispatch`.
- Behavior: connects to Supabase via `psql`, ensures `dm.migration_ledger`, applies `ops_tooling/db/migrations/*.sql`, and enforces checksum immutability.
- Inputs, outputs, artifacts: outputs a CSV report under `out/` and uploads as `migration-report`.
- Secrets: `SUPABASE_DB_PASSWORD`.

### `.github/workflows/db_query.yml`
- Triggers: `workflow_dispatch` with `query_file` input.
- Behavior: runs a SQL file from `ops_tooling/db/queries` and writes CSV output.
- Inputs, outputs, artifacts: output CSV in `out/` uploaded as `query-results`.
- Secrets: `SUPABASE_DB_PASSWORD`.

### `.github/workflows/repo_context.yml`
- Triggers: push to `main` excluding `dm_repo_context.json`.
- Behavior: runs generator placeholder, commits changes except context, generates repo context, commits updated `dm_repo_context.json`.
- Inputs, outputs, artifacts: no artifacts; commits to repo.
- Secrets: none listed.

### `.github/workflows/scaffold_nextjs_fixed.yml`
- Triggers: `workflow_dispatch` with `app_path` and `commit_message` inputs.
- Behavior: scaffolds a Next.js app via `create-next-app`, installs dependencies, builds, then commits and pushes.
- Inputs, outputs, artifacts: no artifacts; commits to repo.
- Secrets: none listed.

### `.github/workflows/updates_apply.yml`
- Triggers: push of `ops_tooling/workflows/updates-inbox/inbox/*.zip` and `workflow_dispatch`.
- Behavior: applies updates via `ops_tooling/workflows/updates-inbox/scripts/updates_apply.py`, validates doc lifecycle, regenerates repo context, commits changes.
- Inputs, outputs, artifacts: no artifacts; commits to repo.
- Secrets: none listed.

### `.github/workflows/validate_dm_actor_model_v1.yml`
- Triggers: `pull_request` and `workflow_dispatch`.
- Behavior: installs `jsonschema` and validates the actor model schema.
- Inputs, outputs, artifacts: none.
- Secrets: none listed.

### `.github/workflows/validate_dm_actors_v1.yml`
- Triggers: `pull_request` with specific paths and `workflow_dispatch`.
- Behavior: installs `jsonschema` and validates actor intake append in validate only mode.
- Inputs, outputs, artifacts: none.
- Secrets: none listed.

## 6) Data and canonical documents
- Document lifecycle authority lives in `docs/document_lifecycle_v1.json` and `docs/DOCUMENT_LIFECYCLE_V1.MD`.
- Canonical actor model and instances live under `docs/canon/actors/` with JSON and MD pairs.
- Actor schema enumerations and required fields are defined in `docs/canon/actors/dm_actor_model_v1.json`.
- Actor instances are listed in `docs/canon/actors/dm_actors_v1.json` and are append only via script validation.
- Lifecycle exempt guidance is in `docs/lifecycle_exempt/README.md` and update inbox payloads live in `ops_tooling/workflows/updates-inbox/inbox`.
- Update packages apply into `docs/` via `ops_tooling/workflows/updates-inbox/scripts/updates_apply.py` with path and lifecycle validation.

## 7) Integrations
- Supabase Postgres database with migrations and workflow driven execution.
- Slack, Gmail, Toast POS, QuickBooks, Found, Canva, OptiSigns, RecipeCostCalculator.com, Amazon Business, WebstaurantStore, Sysco, Google Docs, and OpenAI Chat Models appear as actors in canonical JSON.
- Vercel is referenced in the Next.js starter app and README.

## 8) Risks and unknowns
- unknown: `ops_tooling/scripts/validate_docs_lifecycle_v1.py` expects `docs/<group>/<state>/` layout, while canonical docs live in `docs/canon/actors/`.
- unknown: `ops_tooling/scripts/validate_dm_actor_model_v1.py` targets `docs/dm_actor_model_v1.json`, but canonical actor model is in `docs/canon/actors/`.
- unknown: No server runtime beyond the Next.js starter app is visible, so system execution surfaces might be incomplete.
- unknown: No RLS policies or Supabase edge functions are present in this repo.
- unknown: The update package schema for `ops_tooling/workflows/updates-inbox/scripts/dm_updates_apply.sh` differs from `ops_tooling/workflows/updates-inbox/scripts/updates_apply.py` and the intended primary path is unclear.
- unknown: The canonical SOP JSON source referenced by `ops_tooling/scripts/seed_example_sop.mjs` uses `canon/example_sop_full.json`, which is not present.
- unknown: Database migration strategy uses both `ops_tooling/db/migrations` and `supabase/migrations`, and the intended authoritative set is unclear.
- unknown: Deployment target for `apps/web` is not specified beyond the scaffold and Vercel references.
- unknown: The status field in `docs/canon/actors/dm_actor_model_v1.json` is `draft` while stored under a canonical directory.
- unknown: Any API or data access layer between the web app and Supabase is not visible.

## 9) Suggested next navigation targets
- `AGENTS.md`
- `dm_repo_context.json`
- `docs/document_lifecycle_v1.json`
- `docs/DOCUMENT_LIFECYCLE_V1.MD`
- `docs/canon/actors/README.md`
- `docs/canon/actors/DM_ACTOR_MODEL_V1.MD`
- `docs/canon/actors/dm_actor_model_v1.json`
- `docs/canon/actors/dm_actor_model_v1.schema.json`
- `docs/canon/actors/dm_actors_v1.json`
- `docs/lifecycle_exempt/README.md`
- `ops_tooling/db/migrations/001_init_dm_schema.sql`
- `ops_tooling/db/queries/sop_docs__list.sql`
- `supabase/config.toml`
- `supabase/migrations/20260118172412_remote_schema.sql`
- `supabase/migrations/20260118173000_init_dm_schema.sql`
- `ops_tooling/workflows/updates-inbox/scripts/updates_apply.py`
- `ops_tooling/workflows/updates-inbox/scripts/dm_updates_apply.sh`
- `ops_tooling/scripts/actors_append_validated.py`
- `ops_tooling/scripts/validate_docs_lifecycle_v1.py`
- `ops_tooling/scripts/validate_dm_actor_model_v1.py`
- `ops_tooling/scripts/generate_repo_context.mjs`
- `apps/web/package.json`
- `apps/web/next.config.ts`
- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `ops_tooling/workflows/updates-inbox/docs/README.md`
- `.github/workflows/updates_apply.yml`
- `.github/workflows/db_migrate.yml`
- `.github/workflows/validate_dm_actors_v1.yml`
