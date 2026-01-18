# Implementation Guide

## Local Setup
1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Run development server:
   ```bash
   npm run dev
   ```

## Automation
Scripts in `/scripts` handle seeding and context generation:
- `generate_repo_context.mjs` — regenerates `dm_repo_context.json`
- `seed_example_sop.mjs` — inserts canonical examples into DB

## Database
- Located under `/db`
- Migrations define schema (`/db/migrations`)
- Queries define logic (`/db/queries`)

## Web Interface
- Built on Next.js (`apps/web`)
- Consumes canonical data and context from backend sources
