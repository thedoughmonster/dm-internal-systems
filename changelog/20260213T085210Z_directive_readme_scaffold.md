# Session Entry

- Date (UTC): 2026-02-13T08:52:10Z
- Scope: repository root / `ops_tooling`

## Summary of intent

Add reusable directive tooling under `ops_tooling`:
- a scaffold script for creating a new directive session `README.md`
- a one-word terminal wrapper command for easier execution
- a scaffold script for creating new `TASK_<slug>.md` files inside an existing directive session
- a metadata update script for session/task front-matter scalar `meta` keys

## Files created or modified

- `ops_tooling/scripts/directives/create_directive_readme.mjs` (created)
- `ops_tooling/scripts/directives/create_directive_task.mjs` (created)
- `ops_tooling/scripts/directives/update_directive_metadata.mjs` (created)
- `ops_tooling/scripts/directives/validate_directives_frontmatter.mjs` (created)
- `ops_tooling/scripts/directives/create_handoff.mjs` (created)
- `ops_tooling/scripts/directives/migrate_frontmatter_to_meta_yml.mjs` (created)
- `ops_tooling/scripts/directives/install_git_hooks.sh` (created, executable)
- `ops_tooling/scripts/newdirective` (created, executable)
- `ops_tooling/scripts/newhandoff` (created, executable)
- `ops_tooling/scripts/newtask` (created, executable)
- `ops_tooling/scripts/updatemeta` (created, executable)
- `ops_tooling/scripts/directives-cli` (created, executable)
- `ops_tooling/scripts/architect-updatemeta` (created, executable)
- `ops_tooling/scripts/executor-updatemeta` (created, executable)
- `ops_tooling/scripts/validatedirectives` (created, executable)
- `ops_tooling/scripts/migratedirectives` (created, executable)
- `.githooks/pre-commit` (created, executable)
- `.github/workflows/directives-frontmatter-guard.yml` (created)
- `AGENTS.md` (updated)
- `docs/agent-rules/architect/workflow-and-session-management.md` (updated)
- `docs/agent-rules/executor/discovery-and-startup.md` (updated)
- `docs/agent-rules/shared/role-handoff-automation.md` (updated)
- `docs/agent-rules/shared/directives-model.md` (updated)
- `docs/agent-rules/architect/startup-and-initialization.md` (updated)
- `docs/agent-rules/architect/workflow-and-session-management.md` (updated)
- `docs/agent-rules/executor/discovery-and-startup.md` (updated)

## Decisions made

- Implemented as a Node `.mjs` script to match existing repository script patterns.
- Default output path is `apps/web/.local/directives/<guid>/README.md`.
- Added CLI options for directive metadata overrides while supplying safe defaults.
- Added `--dry-run` for safe preview and validation without filesystem writes.
- Quoted free-text YAML values to avoid malformed front matter when punctuation is present.
- Added an executable Bash wrapper command (`newdirective`) in `ops_tooling/scripts/` that forwards all arguments to the Node scaffold.
- Added interactive prompts for `title` and `summary` when those flags are omitted in a TTY session.
- Added `--no-prompt` to force non-interactive default behavior.
- Anchored directive output path to repository root (derived from script location) so invocation CWD does not affect target directory.
- Added `newtask` task scaffolding with required directive GUID and session existence check to guarantee task files are written to the intended directive directory.
- Added `updatemeta` to update top-level scalar `meta` keys for either directive `README.md` or a specific task file in a directive session.
- Blocked structured keys (`tags`, `depends_on`, `blocked_by`, `related`, `result`) from metadata updater to avoid unsafe front-matter rewrites.
- Added interactive prompt flow to `updatemeta` for missing inputs (`guid`, target selection, task target, key/value pairs).
- Explicitly allowed empty values for optional scalar front-matter fields (for example `assignee: ""`).
- Added strict input validation for `guid`, task slug, task selector format, and path containment to prevent path traversal or malformed directive filenames.
- Replaced line-based YAML mutation in `updatemeta` with parsed YAML updates using `js-yaml` to avoid multiline scalar corruption.
- Added role-aware metadata update enforcement (`architect`, `executor`, `operator`) plus dedicated role wrappers:
  - `architect-updatemeta`
  - `executor-updatemeta`
- Added directive front-matter validator with default and strict modes.
- Added local pre-commit hook and hook install script to validate changed directive files in strict mode.
- Added CI workflow to validate changed directive files in strict mode for push/PR.
- Added governance policy text requiring tool-only front-matter handling with deviation-alert exception path.
- Standardized auto handoff packet format to straight YAML mapping (`handoff:` object) for both chat packets and `HANDOFF.md` semantics.
- Removed ad-hoc key/value packet style in favor of single canonical YAML packet structure.
- Changed handoff artifact path and policy from `HANDOFF.md` to `HANDOFF.yml`.
- Removed chat handoff acceptance and made `HANDOFF.yml` the sole handoff source of truth.
- Added `newhandoff` tooling to generate valid `HANDOFF.yml` artifacts with branch/default inference, worktree mode controls, and validation guards.
- Migrated directives storage model to paired files:
  - content in `.md` files with no YAML frontmatter
  - metadata in `README.meta.yml` and `TASK_<slug>.meta.yml`
- Updated scaffold scripts (`newdirective`, `newtask`) to generate paired markdown/metadata files.
- Updated metadata updater (`updatemeta`) to operate on `.meta.yml` files only.
- Updated handoff generator (`newhandoff`) to source default branch from `README.meta.yml`.
- Reworked directives validator to enforce pair integrity and fail on frontmatter inside `.md`.
- Added `--verbose` mode to directives validator to print per-session and per-file PASS/FAIL checks.
- Added migration utility to convert legacy frontmatter-in-markdown directives into paired `.meta.yml` files.
- Ran migration across local directive sessions and converted legacy `HANDOFF.md` to `HANDOFF.yml`.
- Added unified dispatcher command `directives` (via `directives-cli`) with subcommands for validate/scaffold/update/migrate workflows.
- Added persistent shell alias in `~/.bashrc` mapping `directives` to `/root/src/dm-internal-systems/ops_tooling/scripts/directives-cli`.

## Validation performed

- `node ops_tooling/scripts/directives/create_directive_readme.mjs --help` (pass)
- `node ops_tooling/scripts/directives/create_directive_readme.mjs --title "Directive: Bootstrap" --summary "Create baseline: directive intake" --dry-run` (pass)
- `ops_tooling/scripts/newdirective --help` (pass)
- `ops_tooling/scripts/newdirective --title "Quick Start" --summary "one word wrapper test" --dry-run` (pass)
- `node ops_tooling/scripts/directives/create_directive_readme.mjs --help` (pass; includes `--no-prompt`)
- Interactive TTY dry run with prompted input values for title and summary (pass)
- `(cd /tmp && /root/src/dm-internal-systems/ops_tooling/scripts/newdirective --title "Path Fix" --summary "cwd independent" --dry-run)` (pass; targets `/root/src/dm-internal-systems/apps/web/.local/directives/...`)
- `(cd /root/src/dm-internal-systems/apps/web && /root/src/dm-internal-systems/ops_tooling/scripts/newdirective --title "Path Fix 2" --summary "from subdir" --dry-run)` (pass; targets `/root/src/dm-internal-systems/apps/web/.local/directives/...`)
- `ops_tooling/scripts/newtask --help` (pass)
- `ops_tooling/scripts/newtask --title "Should Fail" --summary "missing guid" --no-prompt --dry-run` (expected fail; confirms required GUID gate)
- `ops_tooling/scripts/newtask --guid cf91fafd-10fe-4097-aea8-a30a09c824db --title "Edge function parity" --summary "Migrate direct calls to edge functions" --dry-run` (pass; targets existing directive session folder)
- `ops_tooling/scripts/updatemeta --help` (pass)
- `ops_tooling/scripts/updatemeta --guid cf91fafd-10fe-4097-aea8-a30a09c824db --set status=in_progress --set session_priority=high --dry-run` (pass)
- `ops_tooling/scripts/updatemeta --guid 65316493-256c-49e2-8241-06dd131588de --task TASK_01-storybook-setup-foundation.md --set status=todo --set assignee=executor --dry-run` (pass)
- `ops_tooling/scripts/updatemeta --guid cf91fafd-10fe-4097-aea8-a30a09c824db --set tags=[] --dry-run` (expected fail; structured key guard)
- `ops_tooling/scripts/updatemeta --guid cf91fafd-10fe-4097-aea8-a30a09c824db --set assignee= --dry-run` (pass; empty scalar value)
- Interactive TTY dry run with prompted GUID/target/key and empty value for `assignee` (pass)
- `node ops_tooling/scripts/directives/create_directive_readme.mjs --guid not-a-guid --no-prompt --dry-run` (expected fail; UUID guard)
- `node ops_tooling/scripts/directives/create_directive_task.mjs --guid cf91fafd-10fe-4097-aea8-a30a09c824db --slug bad/slug --title x --summary y --no-prompt --dry-run` (expected fail; slug guard)
- `ops_tooling/scripts/executor-updatemeta --guid 65316493-256c-49e2-8241-06dd131588de --task TASK_01-storybook-setup-foundation.md --set status=todo --dry-run` (expected fail; executor blocked key guard)
- `ops_tooling/scripts/executor-updatemeta --guid 65316493-256c-49e2-8241-06dd131588de --set status=in_progress --dry-run` (expected fail; executor README guard)
- `ops_tooling/scripts/architect-updatemeta --guid cf91fafd-10fe-4097-aea8-a30a09c824db --task ../../README.md --set status=todo --dry-run` (expected fail; task selector guard)
- `ops_tooling/scripts/executor-updatemeta --guid 65316493-256c-49e2-8241-06dd131588de --task TASK_01-storybook-setup-foundation.md --set assignee= --dry-run` (pass; executor allowed scalar update example)
- `node ops_tooling/scripts/directives/validate_directives_frontmatter.mjs` (pass in default mode)
- `node ops_tooling/scripts/directives/validate_directives_frontmatter.mjs --strict --file apps/web/.local/directives/cf91fafd-10fe-4097-aea8-a30a09c824db/README.md` (pass in strict mode)
- `bash ops_tooling/scripts/directives/install_git_hooks.sh` then `git config --get core.hooksPath` (pass; set to `.githooks`)
- `rg -n "=== AUTO HANDOFF ===|YAML auto handoff|chat YAML handoff" AGENTS.md docs/agent-rules/shared/role-handoff-automation.md` (pass; references aligned to YAML packet language)
- `ops_tooling/scripts/newhandoff --help` (pass)
- `ops_tooling/scripts/newhandoff --guid cf91fafd-10fe-4097-aea8-a30a09c824db --from-role architect --to-role executor --trigger architect_ultra_detected --objective "Execute next task" --blocking-rule "role-boundary" --task-file TASK_remediation-edge-functions-and-labels.md --worktree-mode clean_required --dry-run` (pass; outputs valid `HANDOFF.yml`)
- `node --check ops_tooling/scripts/directives/create_handoff.mjs` (pass)
- `rg -n "HANDOFF\\.md|HANDOFF.md|chat handoff" AGENTS.md docs/agent-rules -S` (pass; no remaining references)
- `node --check ops_tooling/scripts/directives/create_directive_readme.mjs` (pass after pair-model rewrite)
- `node --check ops_tooling/scripts/directives/create_directive_task.mjs` (pass after pair-model rewrite)
- `node --check ops_tooling/scripts/directives/update_directive_metadata.mjs` (pass after pair-model rewrite)
- `node --check ops_tooling/scripts/directives/validate_directives_frontmatter.mjs` (pass after pair-model rewrite)
- `node --check ops_tooling/scripts/directives/migrate_frontmatter_to_meta_yml.mjs` (pass)
- `ops_tooling/scripts/migratedirectives --dry-run` (pass; reported planned migrations)
- `ops_tooling/scripts/migratedirectives` (pass; migrated 62 files)
- `ops_tooling/scripts/validatedirectives` (pass)
- `ops_tooling/scripts/validatedirectives --strict` (pass)
- `ops_tooling/scripts/newdirective --dry-run` (pass; outputs README.md + README.meta.yml pair)
- `ops_tooling/scripts/newtask --guid cf91fafd-10fe-4097-aea8-a30a09c824db --dry-run` (pass; outputs TASK_.md + TASK_.meta.yml pair)
- `ops_tooling/scripts/architect-updatemeta --guid cf91fafd-10fe-4097-aea8-a30a09c824db --set assignee= --dry-run` (pass; updates README.meta.yml)
- `ops_tooling/scripts/executor-updatemeta --guid 65316493-256c-49e2-8241-06dd131588de --task TASK_01-storybook-setup-foundation.md --set assignee= --dry-run` (pass; updates task .meta.yml)
- `ops_tooling/scripts/validatedirectives --verbose` (pass; per-session and per-file PASS output)
- `ops_tooling/scripts/validatedirectives --strict --verbose` (pass; per-session and per-file PASS output in strict mode)
- `bash -ic 'alias directives; directives help; directives --help'` (pass; alias and help flags verified)

## Notes on constraints respected

- Script was added under `ops_tooling/scripts/` per tooling location policy.
- No product runtime code paths were changed.
- No secrets were printed or persisted.

## Addendum (UTC 2026-02-13T10:20:00Z)

### Additional decisions made

- Replaced raw GUID session directory naming with human-readable unique directory names by default:
  - format: `<utc_compact>_<slug>_<shortid>`
- Kept canonical session identity in metadata:
  - `README.meta.yml -> meta.id` remains UUID.
- Added session resolution model across tooling:
  - `--session` accepts either directory name or canonical UUID (`meta.id`).
  - Legacy `--guid` remains as compatibility alias where applicable.
- Enforced UUID uniqueness across sessions at directive creation:
  - `newdirective` now refuses creation when requested/provided `meta.id` already exists in another session.
- Updated handoff generation to resolve session by `--session` and source canonical `session_id` from `README.meta.yml`.
- Updated governance text to align storage/path semantics:
  - use `<session_dir>` for folder paths,
  - use `README.meta.yml` for metadata ownership references.
- Updated default session folder naming to remove random suffix:
  - format is now `YY-MM-DD-hh_<slug>` in UTC.
- Added collision handling for generated names:
  - if the base name already exists, scaffold uses `-2`, `-3`, ... suffixes.
- Kept explicit `--session` behavior strict:
  - explicit names still fail if the target directory already exists.

### Additional validation performed

- `node --check ops_tooling/scripts/directives/create_handoff.mjs` (pass after `--session` migration)
- `node --check ops_tooling/scripts/directives/create_directive_readme.mjs` (pass after uniqueness enforcement)
- `node --check ops_tooling/scripts/directives/create_directive_task.mjs` (pass after import cleanup)
- `(cd /tmp && /root/src/dm-internal-systems/ops_tooling/scripts/directives-cli help)` (pass)
- `(cd /tmp && /root/src/dm-internal-systems/ops_tooling/scripts/directives-cli newdirective --dry-run --title "smoke readable session" --summary "smoke")` (pass)
- `(cd /tmp && /root/src/dm-internal-systems/ops_tooling/scripts/directives-cli newtask --dry-run --session <existing-session-dir> --title "smoke task" --summary "smoke")` (pass)
- `(cd /tmp && /root/src/dm-internal-systems/ops_tooling/scripts/directives-cli newhandoff --dry-run --session <existing-session-dir> --from-role architect --to-role executor --trigger smoke --objective "smoke" --blocking-rule "smoke")` (pass)
- `(cd /tmp && /root/src/dm-internal-systems/ops_tooling/scripts/directives-cli updatemeta --dry-run --session <existing-session-dir> --readme --set summary=smoke)` (pass)
- `ops_tooling/scripts/directives-cli validate --strict --verbose` (pass)
- `ops_tooling/scripts/directives-cli newhandoff --help` (pass)
- `node --check ops_tooling/scripts/directives/_session_resolver.mjs` (pass after timestamp format update)
- `node --check ops_tooling/scripts/directives/create_directive_readme.mjs` (pass after collision-suffix behavior update)
- `ops_tooling/scripts/directives-cli newdirective --dry-run --title "Duplicate Test" --summary "check naming"` (pass; emitted `YY-MM-DD-hh_<slug>` naming format)

## Addendum (UTC 2026-02-13T11:40:00Z)

### Additional decisions made

- Switched directive metadata format from YAML to JSON for stricter structural enforcement.
- Metadata pairing model is now:
  - `README.md` with `README.meta.json`
  - `TASK_<slug>.md` with `TASK_<slug>.meta.json`
- Updated tooling to read/write JSON metadata:
  - session resolver, directive/task scaffolders, metadata updater, handoff generator metadata lookup, and validator.
- Kept `HANDOFF.yml` unchanged for handoff packets.
- Validator now rejects legacy `.meta.yml` files and requires session `meta.id` to be a UUID.
- Migration utility now converts:
  - markdown frontmatter to `.meta.json`,
  - existing `.meta.yml` files to `.meta.json`.

### Additional validation performed

- `ops_tooling/scripts/migratedirectives --dry-run` (pass; planned `.meta.yml` -> `.meta.json` actions listed)
- `ops_tooling/scripts/migratedirectives` (pass; converted existing metadata files)
- `node --check ops_tooling/scripts/directives/_session_resolver.mjs` (pass)
- `node --check ops_tooling/scripts/directives/create_directive_readme.mjs` (pass)
- `node --check ops_tooling/scripts/directives/create_directive_task.mjs` (pass)
- `node --check ops_tooling/scripts/directives/update_directive_metadata.mjs` (pass)
- `node --check ops_tooling/scripts/directives/create_handoff.mjs` (pass)
- `node --check ops_tooling/scripts/directives/validate_directives_frontmatter.mjs` (pass)
- `node --check ops_tooling/scripts/directives/migrate_frontmatter_to_meta_yml.mjs` (pass)
- `ops_tooling/scripts/directives-cli validate --strict --verbose` (pass with `.meta.json` pairs)
- `ops_tooling/scripts/directives-cli newdirective --dry-run --title "json meta smoke" --summary "json smoke"` (pass; outputs `README.meta.json`)
- `ops_tooling/scripts/directives-cli newtask --dry-run --session 26-02-13_delete-this-directive-it-is-a-test --title "json task" --summary "json task"` (pass; outputs `TASK_<slug>.meta.json`)
- `ops_tooling/scripts/directives-cli updatemeta --dry-run --session 26-02-13_delete-this-directive-it-is-a-test --readme --set assignee=` (pass; targets `README.meta.json`)
- `ops_tooling/scripts/directives-cli newhandoff --dry-run --session 26-02-13_delete-this-directive-it-is-a-test --from-role architect --to-role executor --trigger json_meta --objective "json" --blocking-rule "json"` (pass after `meta.id` backfill)

## Addendum (UTC 2026-02-13T11:55:00Z)

### Additional decisions made

- Switched handoff artifact format from YAML to JSON.
- Handoff artifact path is now `HANDOFF.json` (replacing `HANDOFF.yml`).
- Updated `newhandoff` generator to emit JSON and target `HANDOFF.json`.
- Updated migration utility to convert legacy `HANDOFF.md` and `HANDOFF.yml` to `HANDOFF.json`.
- Updated governance docs/rules to reference `HANDOFF.json` as source of truth.

### Additional validation performed

- `node --check ops_tooling/scripts/directives/create_handoff.mjs` (pass after JSON output change)
- `node --check ops_tooling/scripts/directives/migrate_frontmatter_to_meta_yml.mjs` (pass after handoff migration additions)
- `ops_tooling/scripts/migratedirectives` (pass; converted remaining `HANDOFF.yml` to `HANDOFF.json`)
- `ops_tooling/scripts/directives-cli newhandoff --dry-run --session 26-02-12_storybook-component-docs-coverage --from-role architect --to-role executor --trigger json_handoff --objective "json handoff" --blocking-rule "role boundary"` (pass; emits JSON packet)
- `ops_tooling/scripts/directives-cli validate --strict` (pass)

## Addendum (UTC 2026-02-13T12:20:00Z)

### Additional decisions made

- Renamed session parent artifact from `README` to `SESSION` across directive tooling.
- Session pair model is now:
  - `SESSION.md`
  - `SESSION.meta.json`
- Updated all directive script contracts to require `SESSION.*` and treat `README.*` as legacy.
- Added migration behavior to rename existing session files from `README.*` to `SESSION.*`.
- Updated metadata update target flag for clarity:
  - `--session-meta` (new)
  - `--readme` retained as legacy alias.

### Additional validation performed

- `ops_tooling/scripts/migratedirectives` (pass; renamed existing `README.*` to `SESSION.*` in directive sessions)
- `find apps/web/.local/directives -type f -name 'README.md' -o -name 'README.meta.json'` (pass; no results)
- `node --check ops_tooling/scripts/directives/create_directive_readme.mjs` (pass)
- `node --check ops_tooling/scripts/directives/create_directive_task.mjs` (pass)
- `node --check ops_tooling/scripts/directives/create_handoff.mjs` (pass)
- `node --check ops_tooling/scripts/directives/update_directive_metadata.mjs` (pass)
- `node --check ops_tooling/scripts/directives/validate_directives_frontmatter.mjs` (pass)
- `ops_tooling/scripts/directives-cli newdirective --dry-run --title "session file smoke" --summary "session file"` (pass; outputs `SESSION.md` + `SESSION.meta.json`)
- `ops_tooling/scripts/directives-cli updatemeta --dry-run --session 26-02-13_delete-this-directive-it-is-a-test --session-meta --set assignee=` (pass)
- `ops_tooling/scripts/directives-cli validate --strict` (pass)

## Addendum (UTC 2026-02-13T13:30:00Z)

### Additional decisions made

- Standardized directive artifact naming to slug-type JSON files:
  - `<directive_slug>.meta.json`
  - `<directive_slug>.handoff.json`
  - `<task_slug>.task.json`
- Removed `SESSION.*`, `HANDOFF.json`, and `TASK_*.md`/`TASK_*.meta.json` as canonical directive file names.
- Updated directive tooling to discover directive slug files dynamically per session directory.
- Updated task scaffolding to emit semantic task JSON (`kind`, `schema_version`, `meta`, `task`) directly.
- Updated metadata updater target flags:
  - `--directive-meta` for `<directive_slug>.meta.json`
  - `--task <task_slug>` for `<task_slug>.task.json`
  - retained `--readme` as legacy alias for compatibility.
- Updated validator enforcement to fail on legacy file names and validate the new file families.
- Updated migration utility to convert legacy files to the slug-type JSON model, including dotted legacy task filenames.

### Additional validation performed

- `node --check ops_tooling/scripts/directives/_session_resolver.mjs` (pass)
- `node --check ops_tooling/scripts/directives/create_directive_readme.mjs` (pass)
- `node --check ops_tooling/scripts/directives/create_directive_task.mjs` (pass)
- `node --check ops_tooling/scripts/directives/create_handoff.mjs` (pass)
- `node --check ops_tooling/scripts/directives/update_directive_metadata.mjs` (pass)
- `node --check ops_tooling/scripts/directives/validate_directives_frontmatter.mjs` (pass)
- `node --check ops_tooling/scripts/directives/migrate_frontmatter_to_meta_yml.mjs` (pass)
- `ops_tooling/scripts/migratedirectives --dry-run` (pass; expected rename/migration actions listed)
- `ops_tooling/scripts/migratedirectives` (pass; converted active directive sessions to slug-type files)
- `ops_tooling/scripts/directives-cli validate --strict` (pass after migration)
- `ops_tooling/scripts/directives-cli newdirective --dry-run --title "Naming Final" --summary "check"` (pass; outputs `<directive_slug>.meta.json`)
- `ops_tooling/scripts/directives-cli newtask --dry-run --session 26-02-13_delete-this-directive-it-is-a-test --title "Task To Be Done" --summary "task"` (pass; outputs `<task_slug>.task.json`)
- `ops_tooling/scripts/directives-cli newhandoff --dry-run --session 26-02-12_storybook-component-docs-coverage --from-role architect --to-role executor --trigger t --objective o --blocking-rule b` (pass; outputs `<directive_slug>.handoff.json`)
- `ops_tooling/scripts/directives-cli updatemeta --dry-run --session 26-02-12_storybook-component-docs-coverage --directive-meta --set assignee=` (pass)
- `ops_tooling/scripts/directives-cli updatemeta --dry-run --session 26-02-12_storybook-component-docs-coverage --task 00-storybook-contract-lock --set assignee=` (pass)
