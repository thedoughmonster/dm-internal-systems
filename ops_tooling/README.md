<!-- ops_tooling/README.md -->
# ops_tooling

This directory is the home for repo operations and maintenance tooling. It exists to keep the repo root clean and to keep operational concerns co located with their supporting assets and docs.

## What belongs here

Put things here when they support building, validating, migrating, auditing, updating, or operating this repository and its data surfaces.

Examples:

- **Database ops**
  - SQL migrations, query snippets, database utilities
  - `ops_tooling/db/**`

- **Fixtures and test inputs**
  - Vendor ingestion fixture files, sample CSVs, test data artifacts
  - `ops_tooling/fixtures/**`

- **Repo scripts**
  - Validation scripts, context generation, automation helpers, one off utilities that are part of the repo workflow
  - `ops_tooling/scripts/**`

- **Workflow packages and automation assets**
  - Update inbox inputs and applied logs, helper scripts for those workflows, and documentation for how the workflow runs
  - `ops_tooling/workflows/**`

- **Process specific operational state**
  - Inputs, outputs, logs, and artifacts that are part of a defined repo process (and should be versioned)
  - Example: update package logs under `ops_tooling/workflows/updates-inbox/applied/**`

## What does not belong here

Do not put product runtime code or application features here.

Examples:

- **Next.js application code**
  - belongs under `apps/web/**`

- **Supabase runtime surfaces**
  - Edge Functions, Supabase migrations, Supabase config
  - belongs under `supabase/**`

- **Canonical business artifacts and user facing docs**
  - belongs under `docs/**` (or another clearly named docs home if you later reorganize)

- **Untracked local machine artifacts**
  - `node_modules/`, build output, local caches, temp files
  - should not be committed
  - if you need to preserve something for reference, put it in `.archive/` and keep it clearly labeled as historical

## How to add new workflows

When adding a new workflow, co locate everything needed to understand and operate it.

1) Create a workflow root directory under `ops_tooling/workflows/<workflow_name>/`
   - Use lowercase and hyphenated names for workflow directories, for example `vendor-ingestion` or `updates-inbox`

2) Inside that workflow directory, follow this structure:

- `docs/`
  - A short README explaining purpose, entry points, and inputs and outputs
- `scripts/`
  - Any supporting scripts used by humans or automation
- `inbox/` and `applied/` (only if the workflow uses an inbox apply pattern)
  - Keep inputs and applied logs together with the workflow

3) If GitHub Actions is involved
- Keep the actual workflow file under `.github/workflows/` (GitHub requirement)
- The workflow file should call into `ops_tooling/workflows/<workflow_name>/scripts/...`
- Add a small pointer doc under `ops_tooling/workflows/<workflow_name>/docs/` that links the `.github/workflows/...` file to the workflow assets in this directory

4) Update navigation docs
- If an entry point doc like `CODEBASE_SUMMARY.MD` lists core workflows, update it to include the new workflow path
- Add a changelog entry for the session that introduces the workflow, including files touched and the validation commands you ran
