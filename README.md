## Running the Project with Docker

## Documentation authority
- Changelogs are the required record for all work sessions.
- Canonical docs describe stable structures and may lag operational reality.
- Lifecycle and lifecycle_exempt docs are reference and intake guidance, not workflow gates.
- Migrations and workflows/updates-inbox remain authoritative for DB and update history.
- Changelog entries belong in `changelog/` for root scope work and `apps/web/changelog/` for apps/web scope work.
- Every Codex run must add a changelog entry.

Start here:
- AGENTS.md
- CODEBASE_SUMMARY.MD
- docs/DOCUMENTATION_AUDIT.md
- changelog/ and apps/web/changelog/

## Changelog
- All changes require a changelog entry in the appropriate changelog directory.
- Root changes use `changelog/` and web changes use `apps/web/changelog/`.

## Docs policy
- `docs/canon` is directly editable and represents the current narrative documentation.
- `docs/lifecycle_exempt` is deprecated and kept only for historical context unless explicitly reactivated.
- The only hard requirement for docs changes is a changelog entry.

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
