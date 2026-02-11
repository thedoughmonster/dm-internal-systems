# Documentation Audit

Date (UTC): 2026-01-31
Status: historical snapshot (non-authoritative)

This audit is retained for history. Use `AGENTS.md` and `docs/agent-rules/**` for active operational guidance.

## Repo documentation surfaces map
- Root: README.md, AGENTS.md, CODEBASE_SUMMARY.MD, README_structure.txt, changelog/
- docs/: document_lifecycle_v1.json, DOCUMENT_LIFECYCLE_V1.MD, docs/canon/actors, docs/lifecycle_exempt
- apps/web docs: apps/web/README.md, apps/web/AGENTS.md, apps/web/README_COMPONENT_PARADIGM.md, apps/web/ui_style_contract.json, apps/web/ui_style_contract.md
- updates: updates/README.md, updates/inbox, updates/applied

## Canonical entry points
- AGENTS.md: verified only workflow and changelog requirements
- docs/document_lifecycle_v1.json and docs/DOCUMENT_LIFECYCLE_V1.MD: lifecycle governance and path rules
- docs/canon/actors/README.md: canonical actor docs layout and update flow
- CODEBASE_SUMMARY.MD: repo map and scripts overview
- apps/web/AGENTS.md: UI rules and apps/web changelog rules
- apps/web/ui_style_contract.json and apps/web/ui_style_contract.md: UI layout and component contract
- updates/README.md: update inbox overview

## Duplicate or competing docs
- docs/DOCUMENT_LIFECYCLE_V1.MD and docs/lifecycle_exempt/README.md conflict on whether docs/canon is directly editable and on the status of lifecycle_exempt.
- scripts/validate_docs_lifecycle_v1.py expects docs/<group>/<state>/... while canonical docs live under docs/canon/actors without state folders.
- scripts/validate_dm_actor_model_v1.py expects docs/dm_actor_model_v1.json and docs/dm_actor_model_v1.schema.json, but files live under docs/canon/actors.
- docs/canon/actors/DM_ACTOR_MODEL_V1.MD references docs/dm_actor_model_v1.json paths that are not present.
- apps/web/ui_style_contract.json and apps/web/ui_style_contract.md comments point to docs/canon paths even though the files live in apps/web.

## Placement and boundary rules implied by the repo
- Root documentation sets workflow, changelog, and docs policy guardrails.
- docs/ root is reserved for lifecycle authority documents only.
- docs/canon holds lifecycle governed canonical documents with JSON and MD pairing and casing rules.
- docs/lifecycle_exempt holds non authoritative intake or helper artifacts.
- updates/ is the inbox and applied log surface for update packages.
- apps/web documentation governs UI layout, component placement, and style contracts.

## Drift risks ranked
### High
- Lifecycle enforcement mismatch: scripts/validate_docs_lifecycle_v1.py expects a state folder layout, but canonical docs are stored in docs/canon/actors. Validation will fail or block updates.
- Governance contradiction: docs/DOCUMENT_LIFECYCLE_V1.MD says canonical docs are not edited directly, while docs/lifecycle_exempt/README.md says docs/canon can be edited directly and lifecycle_exempt is deprecated.
- Actor model validation path mismatch: scripts/validate_dm_actor_model_v1.py targets docs/dm_actor_model_v1.json and docs/dm_actor_model_v1.schema.json, but canonical files are under docs/canon/actors.

### Medium
- UI contract location drift: apps/web/ui_style_contract.json and apps/web/ui_style_contract.md reference docs/canon in comments, which can mislead readers.
- README_structure.txt is stale compared with the current repo layout and can give false expectations.

### Low
- apps/web/README.md is mostly the default Next.js content and does not link to the UI contract or component paradigm.
- updates/README.md is minimal and does not mention the scripts or validation steps that enforce lifecycle rules.

## Minimal reorganization recommendations
- Add cross links in README.md to docs/document_lifecycle_v1.json and docs/DOCUMENT_LIFECYCLE_V1.MD.
- Add a note in docs/lifecycle_exempt/README.md clarifying how it relates to the lifecycle authority docs.
- Add a short note in docs/canon/actors/DM_ACTOR_MODEL_V1.MD to correct canonical file paths or link to docs/canon/actors/README.md.
- Add links in apps/web/README.md to apps/web/AGENTS.md and the UI style contract files.
- Add a small validation reference in updates/README.md pointing to scripts/updates_apply.py and scripts/validate_docs_lifecycle_v1.py.

## Pruned tree excerpt (max depth 4)
```
.
|-- .devcontainer
|   |-- .devcontainer/devcontainer.json
|   \-- .devcontainer/docker-compose.yml
|-- .dockerignore
|-- .env.local
|-- .github
|   \-- .github/workflows
|       |-- .github/workflows/db_migrate.yml
|       |-- .github/workflows/db_query.yml
|       |-- .github/workflows/updates_apply.yml
|       |-- .github/workflows/validate_dm_actor_model_v1.yml
|       \-- .github/workflows/validate_dm_actors_v1.yml
|-- .gitignore
|-- AGENTS.md
|-- CODEBASE_SUMMARY.MD
|-- Dockerfile
|-- README.md
|-- README_structure.txt
|-- apps
|   \-- apps/web
|       |-- apps/web/.devcontainer
|       |   \-- apps/web/.devcontainer/devcontainer.json
|       |-- apps/web/.env.local
|       |-- apps/web/.gitignore
|       |-- apps/web/AGENTS.md
|       |-- apps/web/Dockerfile
|       |-- apps/web/README.md
|       |-- apps/web/README_COMPONENT_PARADIGM.md
|       |-- apps/web/app
|       |   |-- apps/web/app/(internal)
|       |   |-- apps/web/app/curbside
|       |   |-- apps/web/app/favicon.ico
|       |   |-- apps/web/app/globals.css
|       |   |-- apps/web/app/layout.tsx
|       |   |-- apps/web/app/page.module.css
|       |   |-- apps/web/app/page.tsx
|       |   |-- apps/web/app/ui-kit
|       |   \-- apps/web/app/vendors
|       |-- apps/web/app.zip
|       |-- apps/web/changelog
|       |   |-- apps/web/changelog/20260130T000000Z_session_summary.md
|       |   |-- apps/web/changelog/20260131T102226Z_session_summary.md
|       |   \-- apps/web/changelog/TEMPLATE.md
|       |-- apps/web/components
|       |   \-- apps/web/components/ui
|       |-- apps/web/components.json
|       |-- apps/web/eslint.config.mjs
|       |-- apps/web/hooks
|       |   \-- apps/web/hooks/use-mobile.tsx
|       |-- apps/web/lib
|       |   \-- apps/web/lib/utils.ts
|       |-- apps/web/next-env.d.ts
|       |-- apps/web/next.config.ts
|       |-- apps/web/package-lock.json
|       |-- apps/web/package.json
|       |-- apps/web/postcss.config.js
|       |-- apps/web/public
|       |   |-- apps/web/public/file.svg
|       |   |-- apps/web/public/globe.svg
|       |   |-- apps/web/public/next.svg
|       |   |-- apps/web/public/vercel.svg
|       |   \-- apps/web/public/window.svg
|       |-- apps/web/tailwind.config.ts
|       |-- apps/web/tsconfig.json
|       |-- apps/web/ui_style_contract.json
|       \-- apps/web/ui_style_contract.md
|-- changelog
|   |-- changelog/20260130T000000Z_session_summary.md
|   |-- changelog/20260131T102226Z_session_summary.md
|   \-- changelog/TEMPLATE.md
|-- codex session handoff.txt
|-- compose.yaml
|-- db
|   |-- db/migrations
|   |   \-- db/migrations/001_init_dm_schema.sql
|   \-- db/queries
|       \-- db/queries/sop_docs__list.sql
|-- docs
|   |-- docs/DOCUMENTATION_AUDIT.md
|   |-- docs/DOCUMENT_LIFECYCLE_V1.MD
|   |-- docs/canon
|   |   \-- docs/canon/actors
|   |       |-- docs/canon/actors/DM_ACTOR_MODEL_V1.MD
|   |       |-- docs/canon/actors/README.md
|   |       |-- docs/canon/actors/dm_actor_model_v1.json
|   |       |-- docs/canon/actors/dm_actor_model_v1.schema.json
|   |       \-- docs/canon/actors/dm_actors_v1.json
|   |-- docs/document_lifecycle_v1.json
|   \-- docs/lifecycle_exempt
|       |-- docs/lifecycle_exempt/README.md
|       \-- docs/lifecycle_exempt/vendor_ingestion
|           |-- docs/lifecycle_exempt/vendor_ingestion/IDENTIFIER_FRAMEWORK_V0.MD
|           |-- docs/lifecycle_exempt/vendor_ingestion/PACK_STRING_PARSING_V1.MD
|           |-- docs/lifecycle_exempt/vendor_ingestion/SYSCO_INVOICE_V1_NOTES.MD
|           |-- docs/lifecycle_exempt/vendor_ingestion/VENDOR_CATALOG_VS_INVOICE_LINES_V1.MD
|           |-- docs/lifecycle_exempt/vendor_ingestion/VENDOR_INGESTION_ARCHITECTURE_LIFECYCLE_EXEMPT.md
|           \-- docs/lifecycle_exempt/vendor_ingestion/VENDOR_INGEST_ENTRYPOINT_V0.MD
|-- fixtures
|   \-- fixtures/vendor_ingestion
|       \-- fixtures/vendor_ingestion/sysco
|           \-- fixtures/vendor_ingestion/sysco/v1
|-- package-lock.json
|-- package.json
|-- scripts
|   |-- scripts/actors_append_validated.py
|   |-- scripts/check
|   |-- scripts/dm_updates_apply.sh
|   |-- scripts/extract_to_repo.py
|   |-- scripts/generate_repo_context.mjs
|   |-- scripts/make_update_zip.sh
|   |-- scripts/powershell
|   |   |-- scripts/powershell/dump-env.ps1
|   |   |-- scripts/powershell/env_dump.json
|   |   \-- scripts/powershell/sync-ui-env.ps1
|   |-- scripts/seed_example_sop.mjs
|   |-- scripts/toast_api
|   |   |-- scripts/toast_api/ENV_KEYS.txt
|   |   |-- scripts/toast_api/README.md
|   |   |-- scripts/toast_api/_common.py
|   |   |-- scripts/toast_api/toast_find_curbside_yesterday.py
|   |   |-- scripts/toast_api/toast_host_probe.py
|   |   \-- scripts/toast_api/toast_order_shape.py
|   |-- scripts/updates_apply.py
|   |-- scripts/validate_dm_actor_model_v1.py
|   \-- scripts/validate_docs_lifecycle_v1.py
|-- snapshots_yesterday
|   |-- snapshots_yesterday/curbside_candidates_report.txt
|   |-- snapshots_yesterday/host_probe.txt
|   |-- snapshots_yesterday/http_errors.log
|   \-- snapshots_yesterday/restaurant_id_probe.json
|-- supabase
|   |-- supabase/.gitignore
|   |-- supabase/config.toml
|   |-- supabase/functions
|   |   |-- supabase/functions/ENV_KEYS.txt
|   |   |-- supabase/functions/sysco_invoice_ingest_v1
|   |   |   \-- supabase/functions/sysco_invoice_ingest_v1/index.ts
|   |   |-- supabase/functions/sysco_purchase_history_ingest_v1
|   |   |   \-- supabase/functions/sysco_purchase_history_ingest_v1/index.ts
|   |   |-- supabase/functions/toast_checkin
|   |   |   |-- supabase/functions/toast_checkin/.npmrc
|   |   |   |-- supabase/functions/toast_checkin/deno.json
|   |   |   |-- supabase/functions/toast_checkin/enrichment.ts
|   |   |   |-- supabase/functions/toast_checkin/index.ts
|   |   |   |-- supabase/functions/toast_checkin/slack.ts
|   |   |   |-- supabase/functions/toast_checkin/types.ts
|   |   |   \-- supabase/functions/toast_checkin/utils.ts
|   |   |-- supabase/functions/toast_webhook_capture
|   |   |   |-- supabase/functions/toast_webhook_capture/.npmrc
|   |   |   |-- supabase/functions/toast_webhook_capture/deno.json
|   |   |   \-- supabase/functions/toast_webhook_capture/index.ts
|   |   |-- supabase/functions/vendor_ingest
|   |   |   |-- supabase/functions/vendor_ingest/audit.ts
|   |   |   |-- supabase/functions/vendor_ingest/dispatch.ts
|   |   |   |-- supabase/functions/vendor_ingest/identifier_functions
|   |   |   |-- supabase/functions/vendor_ingest/identifier_types.ts
|   |   |   |-- supabase/functions/vendor_ingest/identify.ts
|   |   |   |-- supabase/functions/vendor_ingest/index.ts
|   |   |   |-- supabase/functions/vendor_ingest/ingest_types.ts
|   |   |   |-- supabase/functions/vendor_ingest/ingestion_handlers
|   |   |   |-- supabase/functions/vendor_ingest/request_parsing.ts
|   |   |   \-- supabase/functions/vendor_ingest/signature_extractors.ts
|   |   |-- supabase/functions/vendor_pack_parse_apply_to_catalog_item_v1
|   |   |   \-- supabase/functions/vendor_pack_parse_apply_to_catalog_item_v1/index.ts
|   |   |-- supabase/functions/vendor_pack_parse_upsert_v1
|   |   |   \-- supabase/functions/vendor_pack_parse_upsert_v1/index.ts
|   |   \-- supabase/functions/webhook-test
|   |       |-- supabase/functions/webhook-test/.npmrc
|   |       |-- supabase/functions/webhook-test/deno.json
|   |       |-- supabase/functions/webhook-test/index.ts
|   |       \-- supabase/functions/webhook-test/supabase
|   \-- supabase/migrations
|       |-- supabase/migrations/20260118170000_01_init_dm_schema.sql.sql
|       |-- supabase/migrations/20260118172412_02_remote_schema.sql.sql
|       |-- supabase/migrations/20260123230126_smoke_test_dm.sql
|       |-- supabase/migrations/20260126013000_03_curbside_orders.sql
|       |-- supabase/migrations/20260126020000_04_curbside_checkins.sql
|       |-- supabase/migrations/20260126210000_create_curbside_checkins.sql
|       |-- supabase/migrations/20260126220000_fix_curbside_checkins_order_found_nullable.sql
|       |-- supabase/migrations/20260127120000_vendor_ingestion_v0.sql
|       |-- supabase/migrations/20260130190000_vendor_ingest_sessions_v1.sql
|       \-- supabase/migrations/20260130200000_vendor_pack_string_parses_v1.sql
\-- updates
    |-- updates/README.md
    |-- updates/actors_inbox
    |   \-- updates/actors_inbox/dm_actors_v1.src.json
    |-- updates/applied
    |   |-- updates/applied/.gitkeep
    |   |-- updates/applied/20260119T104745Z_update_system_map_work_surfaces_v0.zip.json
    |   |-- updates/applied/20260119T110733Z_update_system_map_work_surfaces_v0_with_doc.zip.json
    |   \-- updates/applied/VERIFIED_BEHAVIORS.MD
    \-- updates/inbox
        |-- updates/inbox/.gitkeep
        |-- updates/inbox/sop_step_0_stack_and_conventions_v1_draft
        |   |-- updates/inbox/sop_step_0_stack_and_conventions_v1_draft/manifest.json
        |   \-- updates/inbox/sop_step_0_stack_and_conventions_v1_draft/payload
        \-- updates/inbox/sop_step_0_stack_and_conventions_v1_draft.zip
```

## Checklist for future Codex runs
- Confirm which lifecycle source is authoritative before changing docs governance references.
- Keep lifecycle governed docs paired with JSON and MD using correct casing.
- Keep validation scripts aligned with canonical doc locations.
- Cross link README.md and apps/web/README.md to the relevant governance files.
- Update README_structure.txt when structure changes.
