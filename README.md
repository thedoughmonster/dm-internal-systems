# DM Internal Systems

## Documentation authority
- Changelogs are the required record for all work sessions.
- Reference docs describe stable structures and may lag operational reality.
- Migrations and `ops_tooling/workflows/updates-inbox/` remain authoritative for DB and update history.
- Changelog entries belong in `changelog/` for root scope work and `apps/web/changelog/` for apps/web scope work.

Start here:
- `AGENTS.md`
- `docs/README.md`
- `changelog/` and `apps/web/changelog/`

## Changelog
- All changes require a changelog entry in the appropriate changelog directory.
- Root changes use `changelog/` and web changes use `apps/web/changelog/`.

## Docs policy
- `docs/agent-rules` contains active role guidance.
- `docs/reference` contains domain reference docs.
- `docs/operations` and `docs/policies` contain operational and policy docs.
- Legacy JSON contracts now live in `contracts/`.

## Local development
### Requirements
- Node.js `22.13.1`
- npm (bundled with Node.js)

### Run the web app
1. Install dependencies:
```bash
npm --prefix apps/web ci
```
2. Start the dev server:
```bash
npm --prefix apps/web run dev
```
3. Open `http://localhost:3000`.

### Environment variables
- Create `apps/web/.env` if local variables are required by the app.

### Hidden Files
- run `code .vscode/settings.json` to see file hiding rules. 