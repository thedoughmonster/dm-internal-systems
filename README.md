## Running the Project with Docker

This project provides a Docker-based setup for the Next.js web application located in `./apps/web`.

### Requirements
- **Node.js version:** 22.13.1 (as specified in the Dockerfile)
- **Ports:**
  - `3000` (exposed by the web service)

### Build and Run Instructions

1. **Build and start the web app:**
   ```bash
   docker compose up --build
   ```
   This will build the Next.js app using the provided Dockerfile and start the container on port 3000.

2. **Access the app:**
   Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables
- If your application requires environment variables, create a `.env` file in `./apps/web` and uncomment the `env_file` line in the `docker-compose.yml`.

### Special Configuration
- The Dockerfile uses multi-stage builds to optimize image size and security:
  - Installs dependencies and builds the app in a builder stage.
  - Runs the production app as a non-root user for improved security.
- The Docker Compose file defines a custom bridge network (`webnet`) for service isolation and future extensibility.

### Additional Notes
- If you add external services (e.g., a database), update the `depends_on` section in `docker-compose.yml` accordingly.
- All dependencies are managed via `npm ci` for reproducible builds.

---

_Refer to the individual service README files for more details on each component._
```
dm-internal-systems
├─ 📁.github
│  └─ 📁workflows
│     ├─ 📄db_migrate.yml
│     ├─ 📄db_query.yml
│     ├─ 📄repo_context.yml
│     ├─ 📄scaffold_nextjs_fixed.yml
│     ├─ 📄updates_apply.yml
│     ├─ 📄validate_dm_actors_v1.yml
│     └─ 📄validate_dm_actor_model_v1.yml
├─ 📁apps
│  └─ 📁web
│     ├─ 📁app
│     │  ├─ 📄favicon.ico
│     │  ├─ 📄globals.css
│     │  ├─ 📄layout.tsx
│     │  ├─ 📄page.module.css
│     │  └─ 📄page.tsx
│     ├─ 📁public
│     │  ├─ 📄file.svg
│     │  ├─ 📄globe.svg
│     │  ├─ 📄next.svg
│     │  ├─ 📄vercel.svg
│     │  └─ 📄window.svg
│     ├─ 📄.gitignore
│     ├─ 📄Dockerfile
│     ├─ 📄eslint.config.mjs
│     ├─ 📄next.config.ts
│     ├─ 📄package-lock.json
│     ├─ 📄package.json
│     ├─ 📄README.md
│     └─ 📄tsconfig.json
├─ 📁db
│  ├─ 📁migrations
│  │  └─ 📄001_init_dm_schema.sql
│  └─ 📁queries
│     └─ 📄sop_docs__list.sql
├─ 📁docs
│  ├─ 📁canon
│  │  └─ 📁actors
│  │     ├─ 📄dm_actors_v1.json
│  │     ├─ 📄dm_actor_model_v1.json
│  │     ├─ 📄DM_ACTOR_MODEL_V1.MD
│  │     ├─ 📄dm_actor_model_v1.schema.json
│  │     └─ 📄README.md
│  ├─ 📁lifecycle_exempt
│  │  └─ 📄README.md
│  ├─ 📄document_lifecycle_v1.json
│  └─ 📄DOCUMENT_LIFECYCLE_V1.MD
├─ 📁scripts
│  ├─ 📄actors_append_validated.py
│  ├─ 📄check
│  ├─ 📄dm_updates_apply.sh
│  ├─ 📄generate_repo_context.mjs
│  ├─ 📄make_update_zip.sh
│  ├─ 📄seed_example_sop.mjs
│  ├─ 📄updates_apply.py
│  ├─ 📄validate_dm_actor_model_v1.py
│  └─ 📄validate_docs_lifecycle_v1.py
├─ 📁supabase
│  ├─ 📁migrations
│  │  ├─ 📄20260118172412_remote_schema.sql
│  │  └─ 📄20260118173000_init_dm_schema.sql
│  ├─ 📄.gitignore
│  └─ 📄config.toml
├─ 📁updates
│  ├─ 📁actors_inbox
│  │  └─ 📄dm_actors_v1.src.json
│  ├─ 📁applied
│  │  ├─ 📄.gitkeep
│  │  ├─ 📄20260119T104745Z_update_system_map_work_surfaces_v0.zip.json
│  │  ├─ 📄20260119T110733Z_update_system_map_work_surfaces_v0_with_doc.zip.json
│  │  └─ 📄VERIFIED_BEHAVIORS.MD
│  ├─ 📁inbox
│  │  ├─ 📄.gitkeep
│  │  └─ 📄sop_step_0_stack_and_conventions_v1_draft.zip
│  └─ 📄README.md
├─ 📄.dockerignore
├─ 📄AGENTS.md
├─ 📄CODEBASE_SUMMARY.MD
├─ 📄compose.yaml
├─ 📄dmtree
├─ 📄dm_repo_context.json
├─ 📄README.md
└─ 📄README.md.bak
```
```
dm-internal-systems
├─ 📁.github
│  └─ 📁workflows
│     ├─ 📄db_migrate.yml
│     ├─ 📄db_query.yml
│     ├─ 📄repo_context.yml
│     ├─ 📄scaffold_nextjs_fixed.yml
│     ├─ 📄updates_apply.yml
│     ├─ 📄validate_dm_actors_v1.yml
│     └─ 📄validate_dm_actor_model_v1.yml
├─ 📁apps
│  └─ 📁web
│     ├─ 📁app
│     │  ├─ 📄favicon.ico
│     │  ├─ 📄globals.css
│     │  ├─ 📄layout.tsx
│     │  ├─ 📄page.module.css
│     │  └─ 📄page.tsx
│     ├─ 📁public
│     │  ├─ 📄file.svg
│     │  ├─ 📄globe.svg
│     │  ├─ 📄next.svg
│     │  ├─ 📄vercel.svg
│     │  └─ 📄window.svg
│     ├─ 📄.gitignore
│     ├─ 📄Dockerfile
│     ├─ 📄eslint.config.mjs
│     ├─ 📄next.config.ts
│     ├─ 📄package-lock.json
│     ├─ 📄package.json
│     ├─ 📄README.md
│     └─ 📄tsconfig.json
├─ 📁db
│  ├─ 📁migrations
│  │  └─ 📄001_init_dm_schema.sql
│  └─ 📁queries
│     └─ 📄sop_docs__list.sql
├─ 📁docs
│  ├─ 📁canon
│  │  └─ 📁actors
│  │     ├─ 📄dm_actors_v1.json
│  │     ├─ 📄dm_actor_model_v1.json
│  │     ├─ 📄DM_ACTOR_MODEL_V1.MD
│  │     ├─ 📄dm_actor_model_v1.schema.json
│  │     └─ 📄README.md
│  ├─ 📁lifecycle_exempt
│  │  └─ 📄README.md
│  ├─ 📄document_lifecycle_v1.json
│  └─ 📄DOCUMENT_LIFECYCLE_V1.MD
├─ 📁scripts
│  ├─ 📄actors_append_validated.py
│  ├─ 📄check
│  ├─ 📄dm_updates_apply.sh
│  ├─ 📄generate_repo_context.mjs
│  ├─ 📄make_update_zip.sh
│  ├─ 📄seed_example_sop.mjs
│  ├─ 📄updates_apply.py
│  ├─ 📄validate_dm_actor_model_v1.py
│  └─ 📄validate_docs_lifecycle_v1.py
├─ 📁supabase
│  ├─ 📁migrations
│  │  ├─ 📄20260118172412_remote_schema.sql
│  │  └─ 📄20260118173000_init_dm_schema.sql
│  ├─ 📄.gitignore
│  └─ 📄config.toml
├─ 📁updates
│  ├─ 📁actors_inbox
│  │  └─ 📄dm_actors_v1.src.json
│  ├─ 📁applied
│  │  ├─ 📄.gitkeep
│  │  ├─ 📄20260119T104745Z_update_system_map_work_surfaces_v0.zip.json
│  │  ├─ 📄20260119T110733Z_update_system_map_work_surfaces_v0_with_doc.zip.json
│  │  └─ 📄VERIFIED_BEHAVIORS.MD
│  ├─ 📁inbox
│  │  ├─ 📄.gitkeep
│  │  └─ 📄sop_step_0_stack_and_conventions_v1_draft.zip
│  └─ 📄README.md
├─ 📄.dockerignore
├─ 📄AGENTS.md
├─ 📄CODEBASE_SUMMARY.MD
├─ 📄compose.yaml
├─ 📄dmtree
├─ 📄dm_repo_context.json
├─ 📄Dockerfile
├─ 📄README.md
└─ 📄README.md.bak
```