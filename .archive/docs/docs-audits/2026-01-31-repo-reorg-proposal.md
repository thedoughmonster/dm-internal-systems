# Repo Reorganization Proposal

Status: historical planning artifact (non-authoritative)

Note: Stage 1 completed on 2026-01-31. Root-level db, fixtures, scripts, updates, and workflows now live under ops_tooling/ for operational use. The remaining plan below captures the original proposal for future stages.

## Current state summary
- Workflows are spread across top level folders by file type such as docs, scripts, updates, db, and supabase.
- CI workflows live in .github/workflows while their scripts and inputs live elsewhere.
- Updates, actor intake, and doc lifecycle rules overlap but are not co-located, which creates drift risk.
- Database migrations exist under db/migrations and supabase/migrations with unclear primary source of truth.
- Operational scripts produce outputs in root level folders such as snapshots_yesterday.

## Workflow inventory

### Updates inbox apply
- Purpose: Apply update packages from updates/inbox, validate docs, and log applied packages.
- Entry points: .github/workflows/updates_apply.yml, scripts/updates_apply.py, scripts/dm_updates_apply.sh
- Inputs and outputs: updates/inbox/*.zip, updates/applied/*.json logs, updates/applied/zips, docs/ changes
- Canonical source of truth: scripts/updates_apply.py and updates/inbox
- Current locations: updates/, scripts/updates_apply.py, scripts/dm_updates_apply.sh, scripts/make_update_zip.sh, .github/workflows/updates_apply.yml
- Known pain points: Two apply scripts with different behaviors; applied logs and inbox are separated from scripts.

### Actor intake and validation
- Purpose: Validate and append actor entries into canonical actor documents.
- Entry points: scripts/actors_append_validated.py, .github/workflows/validate_dm_actors_v1.yml, .github/workflows/validate_dm_actor_model_v1.yml
- Inputs and outputs: updates/actors_inbox/dm_actors_v1.src.json, docs/canon/actors/dm_actors_v1.json, docs/canon/actors/dm_actor_model_v1.json, docs/canon/actors/dm_actor_model_v1.schema.json
- Canonical source of truth: docs/canon/actors and scripts/actors_append_validated.py
- Current locations: updates/actors_inbox, docs/canon/actors, scripts/actors_append_validated.py, scripts/validate_dm_actor_model_v1.py
- Known pain points: Validator scripts and inputs are split across updates, docs, scripts, and workflows.

### Document lifecycle governance
- Purpose: Define and validate lifecycle rules for canonical docs.
- Entry points: scripts/validate_docs_lifecycle_v1.py, docs/document_lifecycle_v1.json
- Inputs and outputs: docs/canon, docs/lifecycle_exempt, validation errors
- Canonical source of truth: docs/document_lifecycle_v1.json
- Current locations: docs/document_lifecycle_v1.json, docs/DOCUMENT_LIFECYCLE_V1.MD, docs/canon, docs/lifecycle_exempt, scripts/validate_docs_lifecycle_v1.py
- Known pain points: Validator expects a different folder layout than current docs/canon structure.

### Database migrations and queries
- Purpose: Apply SQL migrations and run ad hoc queries against Supabase Postgres.
- Entry points: .github/workflows/db_migrate.yml, .github/workflows/db_query.yml
- Inputs and outputs: db/migrations/*.sql, db/queries/*.sql, out/*.csv artifacts
- Canonical source of truth: db/migrations for workflow based migrations
- Current locations: db/migrations, db/queries, .github/workflows/db_migrate.yml, .github/workflows/db_query.yml, supabase/migrations
- Known pain points: Two migration sets exist in db/migrations and supabase/migrations without clear ownership.

### Supabase functions and local config
- Purpose: Provide edge functions and local Supabase config for vendor ingest and Toast flows.
- Entry points: supabase/functions/*, supabase/config.toml
- Inputs and outputs: Supabase function code, config, and migrations
- Canonical source of truth: supabase/functions and supabase/config.toml
- Current locations: supabase/functions, supabase/config.toml, supabase/migrations
- Known pain points: Workflow coupling to database and vendor ingest is not co-located with related scripts.

### Repo context generation
- Purpose: Generate repository context metadata for automation.
- Entry points: scripts/generate_repo_context.mjs, updates_apply workflow
- Inputs and outputs: repository tree, dm_repo_context.json
- Canonical source of truth: scripts/generate_repo_context.mjs
- Current locations: scripts/generate_repo_context.mjs
- Known pain points: Generator is detached from the workflow that invokes it.

### Toast operations capture
- Purpose: Collect operational data from Toast and store snapshot outputs.
- Entry points: scripts/toast_api/*
- Inputs and outputs: Toast API requests, snapshots_yesterday/*
- Canonical source of truth: scripts/toast_api
- Current locations: scripts/toast_api, snapshots_yesterday
- Known pain points: Scripts and outputs are separated and live at top level.

### Web app and UI
- Purpose: Serve internal UI for vendor ingest and operations.
- Entry points: apps/web, compose.yaml, apps/web/Dockerfile
- Inputs and outputs: Next.js app, UI components, client side routes
- Canonical source of truth: apps/web
- Current locations: apps/web, compose.yaml, Dockerfile
- Known pain points: UI app is isolated from workflow context docs.

### Dev environment tooling
- Purpose: Standardize local dev setup via containers.
- Entry points: .devcontainer/devcontainer.json, .devcontainer/docker-compose.yml, Dockerfile
- Inputs and outputs: container config and tooling
- Canonical source of truth: .devcontainer and Dockerfile
- Current locations: .devcontainer, Dockerfile, compose.yaml
- Known pain points: Environment files are not grouped with workflows they support.

## Proposed directory layout
```
.
|-- apps
|   |-- web
|-- supabase
|-- workflows
|   |-- updates-inbox
|   |   |-- inbox
|   |   |-- applied
|   |   |-- scripts
|   |   |-- workflows
|   |   |-- docs
|   |-- actors
|   |   |-- intake
|   |   |-- canon
|   |   |-- scripts
|   |   |-- workflows
|   |-- docs-lifecycle
|   |   |-- docs
|   |   |-- scripts
|   |-- db
|   |   |-- migrations
|   |   |-- queries
|   |   |-- workflows
|   |   |-- supabase-migrations
|   |-- repo-context
|   |   |-- scripts
|   |   |-- outputs
|   |-- toast-ops
|   |   |-- scripts
|   |   |-- outputs
|   |-- dev-environment
|   |   |-- docker
|   |   |-- devcontainer
|-- docs
|   |-- REPO_REORG_PROPOSAL.md
```

Notes:
- apps/web and supabase remain in place in the near term.
- workflows/ becomes the primary co-location root for scripts, docs, and logs tied to a workflow.
- docs/ remains for global docs and proposals only to avoid duplication.

## Mapping from old paths to new paths
High level mapping for later stages:
- updates/inbox -> workflows/updates-inbox/inbox
- updates/applied -> workflows/updates-inbox/applied
- updates/README.md -> workflows/updates-inbox/docs/README.md
- scripts/updates_apply.py -> workflows/updates-inbox/scripts/updates_apply.py
- scripts/dm_updates_apply.sh -> workflows/updates-inbox/scripts/dm_updates_apply.sh
- scripts/make_update_zip.sh -> workflows/updates-inbox/scripts/make_update_zip.sh
- .github/workflows/updates_apply.yml -> workflows/updates-inbox/workflows/updates_apply.yml

- updates/actors_inbox -> workflows/actors/intake
- docs/canon/actors -> workflows/actors/canon
- scripts/actors_append_validated.py -> workflows/actors/scripts/actors_append_validated.py
- scripts/validate_dm_actor_model_v1.py -> workflows/actors/scripts/validate_dm_actor_model_v1.py
- .github/workflows/validate_dm_actors_v1.yml -> workflows/actors/workflows/validate_dm_actors_v1.yml
- .github/workflows/validate_dm_actor_model_v1.yml -> workflows/actors/workflows/validate_dm_actor_model_v1.yml

- docs/document_lifecycle_v1.json -> workflows/docs-lifecycle/docs/document_lifecycle_v1.json
- docs/DOCUMENT_LIFECYCLE_V1.MD -> workflows/docs-lifecycle/docs/DOCUMENT_LIFECYCLE_V1.MD
- docs/lifecycle_exempt -> workflows/docs-lifecycle/docs/lifecycle_exempt
- scripts/validate_docs_lifecycle_v1.py -> workflows/docs-lifecycle/scripts/validate_docs_lifecycle_v1.py

- db/migrations -> workflows/db/migrations
- db/queries -> workflows/db/queries
- .github/workflows/db_migrate.yml -> workflows/db/workflows/db_migrate.yml
- .github/workflows/db_query.yml -> workflows/db/workflows/db_query.yml
- supabase/migrations -> workflows/db/supabase-migrations

- scripts/generate_repo_context.mjs -> workflows/repo-context/scripts/generate_repo_context.mjs
- dm_repo_context.json -> workflows/repo-context/outputs/dm_repo_context.json

- scripts/toast_api -> workflows/toast-ops/scripts
- snapshots_yesterday -> workflows/toast-ops/outputs

- Dockerfile -> workflows/dev-environment/docker/Dockerfile
- compose.yaml -> workflows/dev-environment/docker/compose.yaml
- .devcontainer -> workflows/dev-environment/devcontainer

## Staged migration plan

### Stage 1: Updates inbox co-location
- Files to move or rename:
  - updates/inbox -> workflows/updates-inbox/inbox
  - updates/applied -> workflows/updates-inbox/applied
  - updates/README.md -> workflows/updates-inbox/docs/README.md
  - scripts/updates_apply.py -> workflows/updates-inbox/scripts/updates_apply.py
  - scripts/dm_updates_apply.sh -> workflows/updates-inbox/scripts/dm_updates_apply.sh
  - scripts/make_update_zip.sh -> workflows/updates-inbox/scripts/make_update_zip.sh
  - .github/workflows/updates_apply.yml -> workflows/updates-inbox/workflows/updates_apply.yml
- Reference updates:
  - Update paths inside updates_apply workflow and any scripts that read updates/ paths.
  - Update docs references that point to updates/ and scripts/ paths.
- Validation steps:
  - Run python workflows/updates-inbox/scripts/updates_apply.py in a dry run or with empty inbox.
  - Run python workflows/docs-lifecycle/scripts/validate_docs_lifecycle_v1.py after path updates.
- Stop condition:
  - Stop if workflows still reference updates/ or scripts/ paths or if updates_apply fails in a no op run.

### Stage 2: Actor intake workflow
- Files to move or rename:
  - updates/actors_inbox -> workflows/actors/intake
  - docs/canon/actors -> workflows/actors/canon
  - scripts/actors_append_validated.py -> workflows/actors/scripts/actors_append_validated.py
  - scripts/validate_dm_actor_model_v1.py -> workflows/actors/scripts/validate_dm_actor_model_v1.py
  - .github/workflows/validate_dm_actors_v1.yml -> workflows/actors/workflows/validate_dm_actors_v1.yml
  - .github/workflows/validate_dm_actor_model_v1.yml -> workflows/actors/workflows/validate_dm_actor_model_v1.yml
- Reference updates:
  - Update script defaults and workflow paths to new canon and intake locations.
  - Update docs references under docs/ and updates/ to new paths.
- Validation steps:
  - Run actors_append_validated.py with --validate-only pointing to new paths.
- Stop condition:
  - Stop if validation scripts or workflows still point to docs/canon/actors or updates/actors_inbox.

### Stage 3: Document lifecycle governance
- Files to move or rename:
  - docs/document_lifecycle_v1.json -> workflows/docs-lifecycle/docs/document_lifecycle_v1.json
  - docs/DOCUMENT_LIFECYCLE_V1.MD -> workflows/docs-lifecycle/docs/DOCUMENT_LIFECYCLE_V1.MD
  - docs/lifecycle_exempt -> workflows/docs-lifecycle/docs/lifecycle_exempt
  - scripts/validate_docs_lifecycle_v1.py -> workflows/docs-lifecycle/scripts/validate_docs_lifecycle_v1.py
- Reference updates:
  - Update updates_apply script and any workflow references to new lifecycle validator paths.
  - Update README and docs references to new lifecycle doc locations.
- Validation steps:
  - Run validate_docs_lifecycle_v1.py with updated paths.
- Stop condition:
  - Stop if validator still assumes the legacy docs folder structure or if doc paths are broken.

### Stage 4: Database migrations and queries
- Files to move or rename:
  - db/migrations -> workflows/db/migrations
  - db/queries -> workflows/db/queries
  - .github/workflows/db_migrate.yml -> workflows/db/workflows/db_migrate.yml
  - .github/workflows/db_query.yml -> workflows/db/workflows/db_query.yml
  - supabase/migrations -> workflows/db/supabase-migrations
- Reference updates:
  - Update db_migrate and db_query workflows to point to new paths.
  - Decide whether db/migrations or supabase/migrations is the primary source and update docs.
- Validation steps:
  - Run db_query workflow against a known query file in the new path.
  - Run db_migrate workflow in a controlled environment.
- Stop condition:
  - Stop if migration ledger expects files in db/migrations or if supabase tooling requires the current path.

### Stage 5: Repo context workflow
- Files to move or rename:
  - scripts/generate_repo_context.mjs -> workflows/repo-context/scripts/generate_repo_context.mjs
  - dm_repo_context.json -> workflows/repo-context/outputs/dm_repo_context.json
- Reference updates:
  - Update updates_apply workflow to call the new path for repo context generation.
- Validation steps:
  - Run node workflows/repo-context/scripts/generate_repo_context.mjs and confirm output location.
- Stop condition:
  - Stop if any automation expects dm_repo_context.json at repo root.

### Stage 6: Toast operations capture
- Files to move or rename:
  - scripts/toast_api -> workflows/toast-ops/scripts
  - snapshots_yesterday -> workflows/toast-ops/outputs
- Reference updates:
  - Update any documentation or scripts that reference snapshots_yesterday.
- Validation steps:
  - Run a non destructive Toast script if credentials are available.
- Stop condition:
  - Stop if credentials are missing or scripts require absolute paths.

### Stage 7: Dev environment co-location
- Files to move or rename:
  - Dockerfile -> workflows/dev-environment/docker/Dockerfile
  - compose.yaml -> workflows/dev-environment/docker/compose.yaml
  - .devcontainer -> workflows/dev-environment/devcontainer
- Reference updates:
  - Update README and any tooling that references Dockerfile or compose.yaml paths.
- Validation steps:
  - Rebuild containers using the new paths.
- Stop condition:
  - Stop if developer tooling or CI expects Dockerfile and compose.yaml at repo root.

## Risks and mitigations
- Risk: Path changes break automation that assumes current locations.
  - Mitigation: Update references in the same stage and run targeted validation per workflow.
- Risk: Docs lifecycle validator mismatch persists even after moving files.
  - Mitigation: Align validator assumptions in Stage 3 and update lifecycle docs as needed.
- Risk: Dual migration sources remain ambiguous.
  - Mitigation: Decide primary migration source before Stage 4 and document the decision.
- Risk: Moving operational scripts may require updates to environment variables or secrets handling.
  - Mitigation: Stage changes and validate in a controlled environment before pushing.

## Decisions needed from the human operator
- Confirm whether updates_apply.py or dm_updates_apply.sh is the primary updates runner.
- Decide if docs/canon should move under workflows/docs-lifecycle or remain in docs/ with only references moved.
- Choose the primary source of truth for migrations between db/migrations and supabase/migrations.
- Confirm whether dm_repo_context.json can move from repo root without breaking downstream consumers.
- Approve moving snapshots_yesterday into a workflow outputs directory.
- Decide whether Dockerfile and compose.yaml should remain at repo root for tooling compatibility.
