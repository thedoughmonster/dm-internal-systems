# Session Entry

Date (UTC): 2026-02-11T10:36:46Z
Scope: root docs (`docs/agent-rules/**`, `docs/AGENT_RULES_*.MD`, `AGENTS.md`)

## Summary

Created a modular agent rules tree split by role and shared concerns.
Cut role bindings in `AGENTS.md` to the new role entrypoints under `docs/agent-rules/`.
Converted legacy `docs/AGENT_RULES_*.MD` files into compatibility pointer documents.
Reduced cross role redundancy by centralizing common policy in shared modules.
Added strict critical enforcement language with fail closed behavior for all roles.
Removed the deprecated master changelog requirement from active guidance in `AGENTS.md`.
Removed the deprecated no em dash writing rule from active guidance docs.
Audited role-switch trigger points and added automatic cross-role handoff protocol with deterministic packet semantics.
Clarified scheduler precedence so session priority is global and task priority is only intra-session.
Performed docs housecleaning to align role menu with active roles and remove redundant QOL exception entries.

## Intent

Complete role based modularization with stronger policy enforcement and less duplicate role guidance.

## Files created or modified

- `docs/agent-rules/README.md`
- `docs/agent-rules/shared/README.md`
- `docs/agent-rules/shared/critical-enforcement.md`
- `docs/agent-rules/shared/role-handoff-automation.md`
- `docs/agent-rules/shared/baseline-and-safety.md`
- `docs/agent-rules/shared/directives-model.md`
- `docs/agent-rules/architect/README.md`
- `docs/agent-rules/architect/purpose-and-baseline.md`
- `docs/agent-rules/architect/workflow-and-lifecycle.md`
- `docs/agent-rules/architect/startup-and-initialization.md`
- `docs/agent-rules/architect/directive-standards.md`
- `docs/agent-rules/architect/boundaries-and-escalation.md`
- `docs/agent-rules/executor/README.md`
- `docs/agent-rules/executor/purpose-and-baseline.md`
- `docs/agent-rules/executor/discovery-and-startup.md`
- `docs/agent-rules/executor/execution-and-compliance.md`
- `docs/agent-rules/executor/validation-and-deviation.md`
- `docs/agent-rules/executor/stop-and-reporting.md`
- `docs/agent-rules/pair/README.md`
- `docs/agent-rules/pair/scope-and-guardrails.md`
- `docs/agent-rules/pair/startup-and-verification.md`
- `docs/agent-rules/pair/boundaries.md`
- `docs/agent-rules/auditor/README.md`
- `docs/agent-rules/auditor/purpose-and-ultra-priority.md`
- `docs/agent-rules/auditor/startup-and-discovery.md`
- `docs/agent-rules/auditor/boundaries-and-stop.md`
- `docs/agent-rules/role-handoff-audit.md`
- `AGENTS.md`
- `docs/AGENT_RULES_ARCHITECT.MD`
- `docs/AGENT_RULES_EXECUTOR.MD`
- `docs/AGENT_RULES_PAIR.MD`
- `docs/AGENT_RULES_AUDITOR.MD`
- `changelog/20260211T103646Z_agent_rules_modular_cutover.md`

## Decisions

- Added `docs/agent-rules/` as canonical role guidance location.
- Updated role bindings in `AGENTS.md` to `docs/agent-rules/<role>/README.md`.
- Converted legacy `docs/AGENT_RULES_*.MD` into active compatibility pointers.
- Split content into shared modules plus role modules.
- Centralized non negotiable policy in shared critical enforcement module.
- Hardened role documents to require fail closed behavior when critical rules cannot be satisfied.
- Added shared automatic handoff module with sender and receiver requirements.
- Added trigger matrix for Architect, Executor, Pair, and Auditor role transitions.
- Defined explicit precedence: directive session priority outranks task priority across sessions.
- Added `Auditor` to role-selection menu for consistency with active role bindings.
- Removed redundant legacy path entries from QOL exception scope.
- Dropped master changelog update language from active policy docs.
- Dropped no em dash writing language from active policy docs.

## Risks and followups

- Modules should be periodically reviewed for parity drift against operator intent as policies evolve.
- Teams using old file paths should migrate tooling to `docs/agent-rules/` entrypoints.
- Role modules should be kept lean by adding shared references first and avoiding baseline duplication.

## Commands run

- `rg --files docs | rg 'AGENT_RULES|AGENTS|README_COMPONENT_PARADIGM|AGENT_RULES_WEB_UI' | sort`
- `rg -n "^#|^##|^###" docs/AGENT_RULES_ARCHITECT.MD docs/AGENT_RULES_EXECUTOR.MD docs/AGENT_RULES_PAIR.MD docs/AGENT_RULES_AUDITOR.MD AGENTS.md`
- `sed -n` reads for role docs
- `mkdir -p docs/agent-rules/...`
- `find docs/agent-rules -type f | sort`
- rewrite pass for `docs/agent-rules/**` using `cat > ...` updates
- `rg -n -i 'handoff|hand off|switch role|switch to|executor mode|architect mode|pair mode|auditor mode|auto_run|session_priority: ultra|ultra priority|must not switch roles|role assignment' AGENTS.md docs apps/web --glob '*.md' --glob '*.MD'`
- `rg -n "priority|session_priority|Initialization protocol|Startup actions|Directive priority" AGENTS.md docs/agent-rules/shared/directives-model.md docs/agent-rules/architect/startup-and-initialization.md docs/agent-rules/executor/discovery-and-startup.md`
- `rg -n "em dash" docs/agent-rules AGENTS.md docs/AGENT_RULES_*.MD || true`
- `rg -n --glob '*.md' -i 'master_changelog|master changelog' .`
- `rg -n -i 'no em dash|em dash' AGENTS.md docs apps/web/AGENTS.md --glob '*.md' --glob '*.MD' --glob '!**/changelog/**' --glob '!docs/agents-archive/**'`
- `rg -n -i 'draft|todo|tbd|fixme|deprecated|compatibility pointer|canonical source|master_changelog|master changelog|no em dash|em dash' AGENTS.md docs --glob '*.md' --glob '*.MD' --glob '!**/changelog/**' --glob '!docs/agents-archive/**'`
- `git status --short`

## Verification

- Verified canonical role bindings in `AGENTS.md` point to `docs/agent-rules/<role>/README.md`.
- Verified `docs/AGENT_RULES_*.MD` files now act as compatibility pointers.
- Verified shared critical enforcement module is referenced by every role README.
- Verified shared role handoff automation module is referenced by every role README.
- Verified role docs include explicit trigger-based auto handoff behavior for Architect, Executor, Pair, and Auditor.
- Verified precedence language enforces session-priority-first scheduling across directives.
- Verified role selection menu includes Architect, Executor, Pair, and Auditor.
- Verified QOL exception scope references canonical `docs/agent-rules/**` path without redundant legacy entries.
- Verified active guidance docs have no remaining no-em-dash rule references.
- Verified active guidance docs have no remaining master changelog references.

## Constraints respected

- No secrets printed.
- No product code or migrations changed.
- Changes are documentation only.

## Addendum: Root Docs Audit Remediation (2026-02-11)

### Summary

- Audited root-level docs under `docs/` for policy drift and stale authority references.
- Archived lifecycle authority artifacts (`.MD` and `.json`) while retaining root compatibility references.
- Aligned deployment model branch flow with current `dev` and `prod` policy.
- Marked legacy audit and reorg proposal docs as historical and non-authoritative.

### Additional files modified in this addendum

- `docs/DEPLOYMENT_MODEL.md`
- `docs/DOCUMENTATION_AUDIT.md`
- `docs/DOCUMENT_LIFECYCLE_V1.MD`
- `docs/document_lifecycle_v1.json`
- `docs/REPO_REORG_PROPOSAL.md`
- `docs/archive/lifecycle/README.md`
- `docs/archive/lifecycle/DOCUMENT_LIFECYCLE_V1_20260211.MD`
- `docs/archive/lifecycle/document_lifecycle_v1_20260211.json`

### Decisions

- Lifecycle files at docs root remain present as archived compatibility references.
- Archived copies are stored under `docs/archive/lifecycle/` with date-stamped filenames.
- Active operational authority remains `AGENTS.md` and `docs/agent-rules/**`.

### Commands run

- `find docs -mindepth 1 -maxdepth 1 -type f | sort`
- `rg -n -i 'draft|todo|tbd|fixme|deprecated|compatibility pointer|canonical source|master_changelog|master changelog|no em dash|em dash' AGENTS.md docs --glob '*.md' --glob '*.MD' --glob '!**/changelog/**' --glob '!docs/agents-archive/**'`
- `node -e "JSON.parse(require('fs').readFileSync('docs/document_lifecycle_v1.json','utf8')); console.log('JSON_OK')"`
- `mkdir -p docs/archive/lifecycle`
- `cp docs/DOCUMENT_LIFECYCLE_V1.MD docs/archive/lifecycle/DOCUMENT_LIFECYCLE_V1_20260211.MD`
- `cp docs/document_lifecycle_v1.json docs/archive/lifecycle/document_lifecycle_v1_20260211.json`

### Verification

- Verified archived lifecycle copies exist under `docs/archive/lifecycle/`.
- Verified `docs/document_lifecycle_v1.json` is valid JSON after archival metadata update.
- Verified deployment model branch references now align to `dev` and `prod`.

## Addendum: Docs Architecture Finalization (2026-02-11)

### Summary

- Finalized docs structure to keep active role and reference docs in purpose-based folders.
- Moved deprecated governance artifacts and historical audits out of active `docs/` into `.archive/docs/`.
- Repointed actor tooling and CI validation from removed legacy paths to `contracts/actors/*`.
- Updated update-inbox automation paths to use `ops_tooling/workflows/updates-inbox/*` consistently.
- Removed stale active references to retired paths in repo docs and UI pointer comments.

### Additional files modified or moved in this addendum

- `README.md`
- `CODEBASE_SUMMARY.MD`
- `apps/web/README_COMPONENT_PARADIGM.md`
- `apps/web/ui_style_contract.md`
- `apps/web/ui_style_contract.json`
- `.github/workflows/updates_apply.yml`
- `.github/workflows/validate_dm_actors_v1.yml`
- `ops_tooling/scripts/actors_append_validated.py`
- `ops_tooling/scripts/validate_dm_actor_model_v1.py`
- `ops_tooling/scripts/validate_docs_lifecycle_v1.py`
- `ops_tooling/workflows/updates-inbox/scripts/updates_apply.py`
- `docs/README.md`
- `docs/reference/actors/README.md`
- `docs/reference/vendor-ingestion/PACK_STRING_PARSING_V1.MD`
- `docs/reference/vendor-ingestion/VENDOR_INGESTION_ARCHITECTURE_REFERENCE.md`
- `docs/audits/2026-02-11-docs-architecture-audit.md`
- `docs/agent-rules/README.md`
- `docs/agent-rules/web-ui/README.md`
- `docs/agent-rules/architect/README.md`
- `docs/agent-rules/architect/purpose-and-baseline.md`
- `docs/agent-rules/architect/workflow-and-session-management.md`
- `contracts/actors/dm_actor_model_v1.json`
- `contracts/actors/dm_actor_model_v1.schema.json`
- `contracts/actors/dm_actors_v1.json`
- `.archive/docs/lifecycle/*`
- `.archive/docs/docs-audits/*`
- `.archive/docs/agent-rules-monolith/*`

### Decisions

- Active role rule docs are constrained to `docs/agent-rules/**`.
- Active docs no longer include deprecated governance authority files.
- Historical audit snapshots were removed from active docs and archived.
- Legacy actor JSON contract location under docs was retired in favor of `contracts/actors/*`.
- Deprecated docs lifecycle validator now returns success as a compatibility stub.

### Commands run

- `find docs -maxdepth 4 -type f | sort`
- `find docs -maxdepth 3 -type d | sort`
- `rg -n ...` sweeps for retired path references
- `python3 -m py_compile ops_tooling/scripts/actors_append_validated.py ops_tooling/scripts/validate_dm_actor_model_v1.py ops_tooling/scripts/validate_docs_lifecycle_v1.py ops_tooling/workflows/updates-inbox/scripts/updates_apply.py`
- `python3 ops_tooling/scripts/validate_dm_actor_model_v1.py`
- `python3 ops_tooling/scripts/actors_append_validated.py --validate-only`

### Verification

- Verified active docs contain no references to retired legacy paths (`docs/canon`, `docs/lifecycle_exempt`, root lifecycle authority files).
- Verified actor model validation passes using `contracts/actors/*`.
- Verified modified Python scripts compile without syntax errors.
- Verified update-package side effect from one verification run was rolled back (zip restored to inbox, generated artifacts removed).

## Addendum: Archive Location Correction (2026-02-11)

### Summary

- Relocated documentation archives to `.archive/docs/`.
- This keeps `ops_tooling/` scoped to workflows and scripts.

### Paths updated

- `.archive/docs/lifecycle/*`
- `.archive/docs/docs-audits/*`
- `.archive/docs/agent-rules-monolith/*`

### References updated

- `docs/README.md`
- `docs/agent-rules/README.md`
- `docs/audits/2026-02-11-docs-architecture-audit.md`
- `CODEBASE_SUMMARY.MD`

## Addendum: Entry Point Simplification (2026-02-11)

### Summary

- Removed `CODEBASE_SUMMARY.MD` from active repo entry points.
- Moved canonical repository URL/access guidance into `AGENTS.md`.
- Removed `REPO_LINK.md` after inlining its content into `AGENTS.md`.

### Files touched

- `AGENTS.md`
- `docs/agent-rules/web-ui/README.md`
- `README.md`
- `ops_tooling/README.md`
- `CODEBASE_SUMMARY.MD` (deleted)
- `REPO_LINK.md` (deleted)

### Verification

- Verified no active references remain to `CODEBASE_SUMMARY.MD`.
- Verified no active references remain to `REPO_LINK.md`.

## Addendum: Docker Decommission Cleanup (2026-02-11)

### Summary

- Removed Docker runtime/config files because Docker is no longer used for this repo.
- Replaced Docker-based README instructions with local Node/npm setup and run steps.

### Files removed

- `compose.yaml`
- `Dockerfile`
- `apps/web/Dockerfile`
- `.dockerignore`
- `.devcontainer/devcontainer.json`
- `.devcontainer/docker-compose.yml`

### Files updated

- `README.md`

### Verification

- Verified no active Docker references remain in non-archive docs/configs via repository grep.

## Addendum: Root Scripts Consolidation (2026-02-11)

### Summary

- Consolidated the remaining repo-root script into `ops_tooling/scripts/`.
- Updated CI and docs references to use the `ops_tooling` path.
- Added explicit policy language that active tooling must not live under root `scripts/`.

### Files moved

- `scripts/ci/check-test-env.sh` -> `ops_tooling/scripts/ci/check-test-env.sh`

### Files updated

- `.github/workflows/ci-baseline.yml`
- `docs/operations/deployment/infra-status.md`
- `AGENTS.md`
- `ops_tooling/README.md`

### Verification

- Verified repo-root `scripts/` directory no longer exists.
- Verified workflow guard step points to `ops_tooling/scripts/ci/check-test-env.sh`.

## Addendum: apps/web Docs Consolidation (2026-02-11)

### Summary

- Consolidated loose `apps/web` markdown docs into `apps/web/docs/`.
- Removed invalid app-level devcontainer config referencing deleted Docker files.
- Updated global required-reading and rule references to the new component paradigm path.

### Key path changes

- `apps/web/docs/guides/component-paradigm.md` is now the required-reading pointer.
- `apps/web/docs/contracts/ui-style-contract.json`
- `apps/web/docs/contracts/ui-style-contract.md`
- `apps/web/docs/routes/vendors-ingest-guidance.md`
- `apps/web/docs/notes/internal-activity-loader.md`

### Verification

- Verified no active non-changelog references remain to old `apps/web` doc file paths.
- Verified `apps/web` root has no loose `.md` files.
