.
├── AGENTS.md
├── CODEBASE_SUMMARY.MD
├── Dockerfile
├── README.md
├── README_structure.txt
├── apps
│   └── web
│       ├── Dockerfile
│       ├── README.md
│       ├── app
│       │   ├── curbside
│       │   ├── favicon.ico
│       │   ├── globals.css
│       │   ├── layout.tsx
│       │   ├── page.module.css
│       │   └── page.tsx
│       ├── eslint.config.mjs
│       ├── next-env.d.ts
│       ├── next.config.ts
│       ├── package-lock.json
│       ├── package.json
│       ├── public
│       │   ├── file.svg
│       │   ├── globe.svg
│       │   ├── next.svg
│       │   ├── vercel.svg
│       │   └── window.svg
│       └── tsconfig.json
├── compose.yaml
├── db
│   ├── migrations
│   │   └── 001_init_dm_schema.sql
│   └── queries
│       └── sop_docs__list.sql
├── docs
│   ├── DOCUMENT_LIFECYCLE_V1.MD
│   ├── canon
│   │   └── actors
│   │       ├── DM_ACTOR_MODEL_V1.MD
│   │       ├── README.md
│   │       ├── dm_actor_model_v1.json
│   │       ├── dm_actor_model_v1.schema.json
│   │       └── dm_actors_v1.json
│   ├── document_lifecycle_v1.json
│   └── lifecycle_exempt
│       └── README.md
├── package-lock.json
├── package.json
├── scripts
│   ├── actors_append_validated.py
│   ├── check
│   ├── dm_updates_apply.sh
│   ├── extract_to_repo.py
│   ├── generate_repo_context.mjs
│   ├── make_update_zip.sh
│   ├── seed_example_sop.mjs
│   ├── toast_api
│   │   ├── ENV_KEYS.txt
│   │   ├── README.md
│   │   ├── _common.py
│   │   ├── toast_find_curbside_yesterday.py
│   │   ├── toast_host_probe.py
│   │   └── toast_order_shape.py
│   ├── updates_apply.py
│   ├── validate_dm_actor_model_v1.py
│   └── validate_docs_lifecycle_v1.py
├── snapshots_yesterday
│   ├── curbside_candidates_report.txt
│   ├── host_probe.txt
│   ├── http_errors.log
│   └── restaurant_id_probe.json
├── supabase
│   ├── config.toml
│   ├── functions
│   │   ├── ENV_KEYS.txt
│   │   ├── toast_checkin
│   │   │   ├── deno.json
│   │   │   ├── enrichment.ts
│   │   │   ├── html.ts
│   │   │   ├── index.ts
│   │   │   ├── slack.ts
│   │   │   ├── styles.css
│   │   │   ├── types.ts
│   │   │   └── utils.ts
│   │   ├── toast_webhook_capture
│   │   │   ├── deno.json
│   │   │   └── index.ts
│   │   └── webhook-test
│   │       ├── deno.json
│   │       ├── index.ts
│   │       └── supabase
│   ├── migrations
│   │   ├── 20260118170000_01_init_dm_schema.sql.sql
│   │   ├── 20260118172412_02_remote_schema.sql.sql
│   │   └── 20260123230126_smoke_test_dm.sql
│   └── snippets
└── updates
    ├── README.md
    ├── actors_inbox
    │   └── dm_actors_v1.src.json
    ├── applied
    │   ├── 20260119T104745Z_update_system_map_work_surfaces_v0.zip.json
    │   ├── 20260119T110733Z_update_system_map_work_surfaces_v0_with_doc.zip.json
    │   └── VERIFIED_BEHAVIORS.MD
    └── inbox
        ├── sop_step_0_stack_and_conventions_v1_draft
        │   ├── manifest.json
        │   └── payload
        └── sop_step_0_stack_and_conventions_v1_draft.zip

30 directories, 80 files

codex resume 019c0e18-b8ec-79b1-be34-699c7725a5df