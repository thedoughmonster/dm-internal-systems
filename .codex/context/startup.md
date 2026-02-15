# dc startup context

Generated at: 2026-02-15T17:37:29.611Z
Role: auditor
Profile: dm-internal-systems

Startup enforcement:
- Role assignment is already satisfied by startup context.
- Required reading is already bundled below.
- Do not re-run manual role prompts.
- Do not perform broad directive/task rediscovery when directive/task is present in startup context.
- Prefer scripted lifecycle commands (dc directive/task/runbook/meta/validate).

## Startup Context

```json
{
  "kind": "dc_startup_context",
  "schema_version": "1.0",
  "generated_at": "2026-02-15T17:37:29.611Z",
  "profile": "dm-internal-systems",
  "role": "auditor",
  "directive": null,
  "task": null,
  "runtime": {
    "agent": "codex",
    "model": "gpt-5.3-codex",
    "session_log_file": null
  },
  "startup_rules": {
    "role_assignment_already_satisfied": true,
    "required_reading_already_in_bundle": true,
    "skip_manual_role_prompt": true,
    "skip_manual_directive_listing_when_directive_selected": false,
    "skip_manual_task_listing_when_task_selected": false,
    "task_selection_state": "not_requested",
    "prefer_scripted_lifecycle_commands": true,
    "prohibit_command_guessing": true,
    "require_help_lookup_on_command_ambiguity": true,
    "require_operator_discovery_phase": true,
    "require_operator_go_ahead_before_execution": true,
    "require_model_gate": true,
    "require_thinking_gate": true,
    "require_scope_approval_before_architect_authoring": false,
    "executor_task_bound_handoff_auto_execute": false,
    "architect_authoring_no_code_edits_without_task_and_handoff": false,
    "require_task_breakdown_approval_before_task_creation": false,
    "require_task_contract_approval_before_handoff": false,
    "require_handoff_before_executor_execution": false,
    "architect_discovery_mode_required": false,
    "architect_min_clarifying_questions": 0,
    "architect_must_echo_discovery_before_task_drafting": false
  },
  "role_transition": "",
  "operator_discovery": {
    "required": true,
    "checklist": [
      "Confirm intended outcome in operator words.",
      "Confirm hard constraints and excluded scope.",
      "Confirm definition of done and validation evidence expected.",
      "Ask whether to start execution now or refine plan first.",
      "For architect sessions, ask whether to stay in discovery mode or enter authoring mode.",
      "Do not enter authoring mode until operator explicitly approves scope and direction."
    ],
    "before_any_command": true
  },
  "model_thinking_gate": {
    "required": true,
    "checklist": [
      "Ask operator whether to keep or switch model.",
      "Ask operator to set/confirm thinking depth.",
      "Pause execution until operator confirms model/thinking state."
    ]
  },
  "architect_discovery_protocol": null,
  "next_actions": []
}
```

## DC Command Reference

```json
{
  "kind": "dc_command_reference",
  "schema_version": "1.0",
  "generated_at": "2026-02-15T17:37:29.604Z",
  "policy": {
    "no_guessing": true,
    "help_on_ambiguity": [
      "dc help",
      "dc <category> --help",
      "dc <category> <command> --help"
    ],
    "scripted_actions_only": true,
    "require_operator_go_ahead_before_execution": true
  },
  "audiences": {
    "operator_only": [
      "dc init",
      "dc directive new",
      "dc context build",
      "dc context bootstrap",
      "dc launch codex",
      "dc launch switch"
    ],
    "operator_and_machine": [
      "dc codex usage",
      "dc repo map",
      "dc directive view",
      "dc directive archive",
      "dc directive merge",
      "dc directive migrate",
      "dc validate",
      "dc test",
      "dc help",
      "dc context check",
      "dc context show",
      "dc launch handoff"
    ],
    "machine_only": [
      "dc policy validate",
      "dc runbook executor-task-cycle",
      "dc runbook executor-directive-closeout",
      "dc runbook executor-directive-cleanup",
      "dc runbook architect-authoring",
      "dc directive task",
      "dc directive handoff",
      "dc directive start",
      "dc task start",
      "dc task finish",
      "dc directive finish",
      "dc directive archive",
      "dc directive merge",
      "dc directive cleanup",
      "dc meta update",
      "dc meta architect",
      "dc meta executor"
    ]
  },
  "commands": {
    "directive": [
      "dc directive new",
      "dc directive task",
      "dc directive handoff",
      "dc directive view",
      "dc directive archive",
      "dc directive merge",
      "dc directive start",
      "dc directive finish",
      "dc directive cleanup",
      "dc directive migrate"
    ],
    "task": [
      "dc task start",
      "dc task finish"
    ],
    "meta": [
      "dc meta update",
      "dc meta architect",
      "dc meta executor"
    ],
    "runbook": [
      "dc runbook executor-task-cycle",
      "dc runbook executor-directive-closeout",
      "dc runbook executor-directive-cleanup",
      "dc runbook architect-authoring"
    ],
    "utility": [
      "dc codex usage",
      "dc validate",
      "dc test",
      "dc policy validate",
      "dc repo map"
    ],
    "context": [
      "dc context build",
      "dc context check",
      "dc context show",
      "dc context bootstrap"
    ],
    "launch": [
      "dc launch codex",
      "dc launch switch",
      "dc launch handoff"
    ]
  }
}
```

## Role Bundle

# Codex Context Bundle

Generated at: 2026-02-15T17:37:29.608Z

## Source: .directive-cli/AGENTS.md

```markdown
# DM Internal Systems – Agent Charter (Entrypoint)

This file is the startup entrypoint.
Canonical machine-operational rules are policy JSON files under `.directive-cli/policies/` and lifecycle scripts under `.directive-cli/scripts/directives/`.

## Role assignment requirement

All new conversations or threads must begin with explicit role assignment unless role is already fixed by startup context.

When startup context is provided by `dc launch codex` (or `dc context start`) role bundle (and optional `*.startup.json` in bundle sources), role assignment is already satisfied. Do not ask for role again.

Only ask:

Which role am I being assigned?
1. Architect
2. Executor
3. Pair
4. Auditor

when role is not already fixed by startup context or valid handoff.

Exception:
- A valid session-local `<directive_slug>.handoff.json` targeting the receiver role counts as explicit role assignment.

## Required reading

- Primary startup context must come from `.codex/context/startup.md`, generated by `dc context bootstrap` or `dc launch codex` (`dc context start`) before Codex launch.
- Canonical dc command surface must come from bundled `.codex/context/dc.commands.json` (embedded in startup context).
- If no compiled bundle is active, read `apps/web/docs/guides/component-paradigm.md` and selected role `README.md`.
- If compiled bundle is active, treat included files as already read. Do not re-open bundle source files unless operator requests deep audit or specific source verification.
- If startup context includes selected directive/task, use them as active execution context and skip manual repository-wide session/task discovery.

## Operator discovery gate

- Before any command execution or file edits, run an operator discovery check:
  - intended outcome
  - hard constraints and excluded scope
  - definition of done and validation evidence
  - explicit go-ahead to execute now
- Do not run commands until operator gives explicit go-ahead.
- Architect default mode is conversational discovery; do not begin task authoring until operator explicitly approves scope and direction.
- If any `dc` command usage is uncertain, run help first; do not guess command names or flags.

## Operational source of truth

Operational procedure is script-owned:
- `dc runbook ...`
- `dc directive start|finish ...`
- `dc task start|finish ...`
- Preferred directive finalization: `dc runbook executor-directive-closeout --session <s> --confirm executor-directive-closeout`

If markdown procedure text conflicts with runtime script behavior, script behavior wins.

## Canonical machine policies

- `.directive-cli/policies/core.policy.json`
- `.directive-cli/policies/executor.lifecycle.policy.json`
- `.directive-cli/policies/architect.authoring.policy.json`
- `.directive-cli/policies/runbook.flow.json`
- `.directive-cli/policies/handoff.schema.json`

Validate policies with:
- `dc policy validate`

## Directive model

- Session root: `.directive-cli/directives/<session_dir>/`
- Session file: `<directive_slug>.meta.json`
- Task file: `<task_slug>.task.json`
- Handoff file: `<directive_slug>.handoff.json`

## Metadata tooling policy

Do not edit directive metadata manually in normal flow.
Use tooling:
- `dc directive new`
- `dc directive task`
- `dc directive handoff`
- `dc meta architect`
- `dc meta executor`
- `dc validate`

Directive intake policy:
- Capture operator goals during `dc directive new` (interactive goal lines or repeatable `--goal` flags).
- Store goals in session metadata as `meta.goals` and preserve them during later metadata updates.

## Execution context gate

Executor may execute when context is provided by either:
- valid session-local handoff artifact, or
- operator-selected session/task through `dc` lifecycle commands.

## Data access rule

- UI reads and writes go through Edge Functions.
- Do not call Supabase REST endpoints directly from UI code.
- Local directives UI exception: local reads/writes in `.directive-cli/directives/`.

## Secret handling (mandatory)

- Never print secret values in chat output.
- Redact secrets as `[REDACTED]`.
- If uncertain whether a value is secret, redact.

## Changelog rule

- Sessions touching root scope add one entry under `changelog/`.
- Sessions touching `apps/web` add one entry under `apps/web/changelog/`.

## Role bindings

- Architect: `.directive-cli/docs/agent-rules/architect/README.md`
- Executor: `.directive-cli/docs/agent-rules/executor/README.md`
- Pair: `.directive-cli/docs/agent-rules/pair/README.md`
- Auditor: `.directive-cli/docs/agent-rules/auditor/README.md`

```

## Source: apps/web/docs/guides/component-paradigm.md

```markdown
<!-- apps/web/docs/guides/component-paradigm.md -->

# DM UI Component Paradigm

This file is the required-reading pointer for web UI work.
The source of truth lives in `docs/agent-rules/web-ui/README.md`.

UI style contract:
- `apps/web/docs/contracts/ui-style-contract.json`
- `apps/web/docs/contracts/ui-style-contract.md`

Lint enforces component import boundaries and route boundaries.
See `apps/web/eslint.config.mjs` and `apps/web/lib/eslint`.

```

## Source: .directive-cli/policies/architect.authoring.policy.json

```json
{
  "kind": "directive_cli_policy",
  "policy_id": "architect_authoring",
  "version": "1.0.0",
  "summary": "Architect policy for directive authoring and handoff.",
  "authoring": {
    "scaffold_commands": [
      "dc directive new",
      "dc directive task",
      "dc directive handoff",
      "dc meta architect"
    ],
    "require_validation_before_handoff": true,
    "required_directive_meta_fields": [
      "directive_branch",
      "directive_base_branch",
      "directive_merge_status",
      "commit_policy"
    ]
  }
}

```

## Source: .directive-cli/policies/core.policy.json

```json
{
  "kind": "directive_cli_policy",
  "policy_id": "core",
  "version": "1.0.0",
  "summary": "Core execution policy for directive-cli lifecycle automation.",
  "rules": {
    "operational_source_of_truth": [
      "dc runbook",
      "dc directive start",
      "dc directive finish",
      "dc task start",
      "dc task finish"
    ],
    "directive_tooling_root": ".directive-cli",
    "metadata_edit_mode": "tooling_only"
  },
  "executor_execution_context": {
    "allowed_sources": [
      "handoff_file",
      "dc_operator_selection"
    ],
    "require_handoff_for_execution": false
  }
}

```

## Source: .directive-cli/policies/executor.lifecycle.policy.json

```json
{
  "kind": "directive_cli_policy",
  "policy_id": "executor_lifecycle",
  "version": "1.0.0",
  "summary": "Executor lifecycle policy enforced by directive/task scripts.",
  "lifecycle": {
    "branch_source": "directive_meta",
    "branch_bootstrap_mode": "create_from_local_base_if_missing_local",
    "remote_sync_mode": "none",
    "push_on_task_finish": true,
    "push_on_directive_finish": true,
    "require_clean_tree_on": [
      "directive_start",
      "task_start"
    ],
    "allow_task_status_updates_via_lifecycle": true,
    "allow_task_updated_timestamp_via_lifecycle": true,
    "forbid_manual_task_meta_fields": [
      "bucket"
    ],
    "commit_policy_values": [
      "per_task",
      "per_collection",
      "end_of_directive"
    ]
  },
  "handoff_enforcement": {
    "require_branch_match_when_handoff_present": true
  }
}

```

## Source: .directive-cli/policies/handoff.schema.json

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "directive-cli/handoff.schema.json",
  "title": "Directive Handoff",
  "type": "object",
  "required": [
    "handoff"
  ],
  "properties": {
    "handoff": {
      "type": "object",
      "required": [
        "from_role",
        "to_role",
        "trigger",
        "session_id",
        "directive_branch",
        "objective",
        "blocking_rule",
        "worktree_mode",
        "worktree_allowlist_paths"
      ],
      "properties": {
        "from_role": {
          "type": "string",
          "enum": [
            "architect",
            "executor",
            "pair",
            "auditor"
          ]
        },
        "to_role": {
          "type": "string",
          "enum": [
            "architect",
            "executor",
            "pair",
            "auditor"
          ]
        },
        "trigger": {
          "type": "string",
          "minLength": 1
        },
        "session_id": {
          "type": "string",
          "minLength": 1
        },
        "task_file": {
          "type": [
            "string",
            "null"
          ]
        },
        "directive_branch": {
          "type": "string",
          "minLength": 1
        },
        "required_reading": {
          "type": "string"
        },
        "objective": {
          "type": "string",
          "minLength": 1
        },
        "blocking_rule": {
          "type": "string",
          "minLength": 1
        },
        "worktree_mode": {
          "type": "string",
          "enum": [
            "clean_required",
            "known_dirty_allowlist"
          ]
        },
        "worktree_allowlist_paths": {
          "type": "array",
          "items": {
            "type": "string"
          }
        }
      },
      "additionalProperties": true
    }
  },
  "additionalProperties": true
}

```

## Source: .directive-cli/policies/runbook.flow.json

```json
{
  "kind": "directive_cli_policy",
  "policy_id": "runbook_flow",
  "version": "1.0.0",
  "flow_version": "1.0",
  "roles": {
    "architect": {
      "phase": "authoring",
      "steps": [
        "operator confirmation gate",
        "dc directive new",
        "dc meta architect",
        "dc directive task",
        "dc validate",
        "dc directive handoff"
      ]
    },
    "executor": {
      "phase": "execution",
      "steps": [
        "operator confirmation gate",
        "dc directive start",
        "dc task start",
        "implement scoped changes",
        "dc task finish",
        "repeat remaining tasks",
        "operator QA gate",
        "dc runbook executor-directive-closeout",
        "dc directive finish",
        "dc directive archive",
        "dc directive cleanup"
      ]
    }
  }
}

```

## Source: .directive-cli/docs/agent-rules/shared/README.md

```markdown
# Shared Rules Modules

Status: active
These modules are mandatory for all roles.

## Required read order

1. `critical-enforcement.md`
2. `role-handoff-automation.md`
3. `baseline-and-safety.md`
4. `directives-model.md`

## Usage

Role docs must reference shared modules instead of duplicating baseline policy.

```

## Source: .directive-cli/docs/agent-rules/shared/baseline-and-safety.md

```markdown
# Baseline And Safety

## Baseline anchors

All roles follow baseline policy defined in `.directive-cli/AGENTS.md`.

- verified only operating model
- changelog requirements when applicable
- role assignment and required reading protocol
- secret handling and redaction policy

## Data access policy

- All UI reads and writes go through Edge Functions.
- Direct Supabase REST calls from UI code are forbidden.
- Approved local exception: `/directives` UI may read and write `.directive-cli/directives/` directly for local use.

## Migration naming policy

- Migration filename format: `YYYYMMDDhhmmss_description.sql`
- `T` and `Z` are not allowed in migration filenames.

```

## Source: .directive-cli/docs/agent-rules/shared/critical-enforcement.md

```markdown
# Critical Enforcement

These rules are non negotiable. Every role must enforce them exactly.

## Critical rules

1. Role lock
- Role is selected at session start and does not change mid session.
- If requested work requires another role, use automatic handoff protocol from `.directive-cli/docs/agent-rules/shared/role-handoff-automation.md`.

2. Required reading gate
- Required reading must be completed before any substantive action.
- If required reading cannot be completed, stop.

3. Verified only gate
- Do not claim capability or validation unless executed in this repository.
- If verification cannot be run, state that explicitly and stop any claim of certainty.

4. Secret safety gate
- Never print secrets in chat output.
- Redact sensitive values in logs, diffs, and diagnostics.
- If command output may expose secrets, do not run it without explicit operator approval.

5. Data access gate
- UI reads and writes must use Edge Functions.
- Direct Supabase REST calls from UI code are forbidden.
- Local `/directives` UI file access exception is allowed.

6. Directive contract gate
- Work must follow explicit Objective, Constraints, Allowed files, Steps, Validation, Expected output, and Stop conditions when using directives.
- If contract is incomplete for safe execution, stop and request clarification.
- Missing required commit checkpoint or unresolved merge-safety evidence is fail-closed and blocks continuation.

7. Git authority gate
- During directive sessions, state-changing git commands are Executor-owned by default.
- Architect may run state-changing git commands only on `chore/*` branches, with explicit operator instruction or explicit directive task instruction.
- Exception: Architect may create and switch to the directive branch only when it is a `chore/*` branch, as part of directive setup prior to Executor handoff.
- Architect `chore/*` state-changing git is limited to governance and housekeeping assets only: `.directive-cli/**`, `AGENTS.md`, `docs/**`, `changelog/**`, `apps/web/changelog/**`, and `.directive-cli/directives/**`.
- If planned or staged files include product code, Architect must stop and hand off to Executor before any state-changing git.
- Architect state-changing commits on `chore/*` must use commit subject prefix `chore(architect):`.
- Architect must not run state-changing git on `feat/*`, `fix/*`, `dev`, or `prod`.
- Non-Executor roles other than Architect may use read-only git inspection commands only.
- If state-changing git is required outside these rules, write `<directive_slug>.handoff.json` for the next role or request explicit operator role reset.

8. Unexpected changes gate
- If unexpected working tree changes are detected, stop immediately and report.
- Exception: changes explicitly declared through handoff `worktree_mode: known_dirty_allowlist` and exact `worktree_allowlist_paths` are treated as expected for that handoff only.

9. Governance ownership gate
- Governance rule updates in `.directive-cli/AGENTS.md`, `AGENTS.md`, `.directive-cli/docs/agent-rules/**`, and `apps/web/docs/guides/agent-guidance.md` are Architect-owned.
- For governance-only rule updates, Architect executes end to end on a dedicated `chore/*` branch and does not hand off implementation to Executor.

## Fail closed behavior

When any critical rule is violated or cannot be satisfied:

- stop immediately
- report the blocking rule and affected files
- request explicit operator direction before proceeding

No silent continuation is allowed.

## Override protocol

- Overrides must be explicit in chat from the operator.
- Apply only the minimum scope required by the override.
- Do not generalize one override to other rules or tasks.

```

## Source: .directive-cli/docs/agent-rules/shared/directives-model.md

```markdown
# Directives Model

## Storage model

- Session root: `.directive-cli/directives/<session_dir>/`
- Session intake content: `<directive_slug>.meta.json` (non executable)
- Session intake metadata: `<directive_slug>.meta.json`
- Executable task content: `<task_slug>.task.json`
- Executable task metadata: `<task_slug>.task.json`
- Execution handoff artifact (required): `<directive_slug>.handoff.json`

## Procedure precedence

- Lifecycle scripts and runbooks are the canonical execution procedure:
  - `dc runbook ...`
  - `dc directive start|finish ...`
  - `dc task start|finish ...`
- If procedural prose conflicts with lifecycle script behavior, lifecycle scripts and runbooks win.

Session identity rules:

- Session directory names are human-readable and unique.
- Canonical session UUID is stored in `<directive_slug>.meta.json` as `meta.id`.

Pairing rules:

- Session metadata file name is `<directive_slug>.meta.json`.
- Task file names are `<task_slug>.task.json`.
- Handoff file name is `<directive_slug>.handoff.json`.

## Task minimum contract

Every executable task must include:

- Objective
- Constraints
- Allowed files
- Steps
- Validation
- Expected output
- Stop conditions

## Task metadata minimums

Every executable task must include at least:

- `title`
- `status`
- `priority`
- `session_priority`
- `summary`
- `execution_model`
- `thinking_level`

## Task result update contract

- Executor is the only role that may write task `meta.result`.
- Executor may update `meta.result` only for the task file that was executed.
- Task `meta.result` must include:
  - `summary`: one line factual outcome
  - `validation`: commands run and pass or fail outcomes, or explicit not-run reason
  - `updated`: UTC timestamp
- Executor must not manually modify task `meta.bucket` or session `<directive_slug>.meta.json` metadata.
- Lifecycle commands `dc task start` and `dc task finish` may update task `meta.status` and task `meta.updated`.
- Architect reconciles task and session metadata after execution by using Executor `meta.result` evidence.
- Completion metadata must not be set to done when required validation evidence is missing or failing.

## Collection metadata minimums

If a task belongs to a collection, task metadata must include:

- `collection_id`
- `collection_title`
- `collection_order`
- `collection_commit_label`
- `collection_merge_ready`

Collection rules:

- `collection_id` must be stable within the session and reused by all tasks in the same collection.
- `collection_order` must be an integer starting at `1` for ordering inside a collection.
- `collection_commit_label` must be a short, commit-safe token used for collection completion checkpoint commits.
- `collection_merge_ready` remains `false` until merge-safety evidence is complete.
- A collection is valid only when all tasks in that collection can merge to `dev` without breaking verified behavior.

## Directive branch and commit policy metadata

Session `<directive_slug>.meta.json` metadata must include:

- `directive_branch`
- `directive_base_branch`
- `directive_merge_status`
- `commit_policy`

Session goal metadata:

- `meta.goals` is optional but recommended.
- When present, `meta.goals` must be an array of non-empty one-line strings.
- Goals are operator intent anchors and should be preserved through task drafting, handoff, and reconciliation.

Branch metadata rules:

- `directive_branch` must be a non empty string.
- Missing or empty `directive_branch` blocks drafting and execution (fail closed).

Value conventions:

- `directive_base_branch`: typically `dev`
- `directive_merge_status`: `open`, `merge_ready`, `merged`, `blocked`
- `commit_policy`: `per_task`, `per_collection`, `end_of_directive`

Lifecycle rules:

- Architect defines branch lifecycle requirements in the directive.
- Architect must ensure `directive_branch` exists before handing off execution.
- `<directive_slug>.handoff.json` for directive execution must include `handoff.directive_branch`.
- Executor must verify it is on `directive_branch` before any edits; `dc directive start` may create missing local branch from `directive_base_branch` according to directive metadata.
- State-changing branch operations are executed by Executor by default, with Architect `chore/*` exception governed by `.directive-cli/AGENTS.md`.
- Completed directives with unmerged branches must be surfaced during Architect startup and resolved or explicitly blocked.
- Open branches are allowed for active blocked or in-progress directives when tracked in session metadata. Untracked stale directive branches are forbidden.

Commit policy rules:

- Do not assume per-task commits.
- If `commit_policy` is `per_collection`, collection completion requires a labeled checkpoint commit using `collection_commit_label`.
- If `commit_policy` is `end_of_directive`, task completion may occur without intermediate commits.
- Missing or invalid `commit_policy` blocks execution.

## Collection merge-safety evidence

`collection_merge_ready` may be treated as satisfied only when evidence includes:

- all tasks in the collection are complete
- required validation commands for the collection passed in this repository
- no unresolved blocking risks that would make merge unsafe
- explicit statement that merge to `dev` is expected to be non-breaking based on executed validation

## Status and priority conventions

- `session_priority`: `urgent`, `high`, `medium`, `low`
- `priority`: `urgent`, `high`, `medium`, `low`
- `status`: `todo`, `in_progress`, `blocked`, `done`, `archived`
- `ultra` is reserved for Auditor.

## Priority resolution order

- Global scheduling is determined by session `session_priority`.
- Task `priority` is scoped to ordering tasks inside the selected session only.
- A task in a higher priority session outranks any task in a lower priority session, regardless of task priority values.

```

## Source: .directive-cli/docs/agent-rules/shared/role-handoff-automation.md

```markdown
# Role Handoff Automation

This module defines automatic handoff behavior when a role boundary is reached.

## Handoff contract

Automatic handoff is valid only when sender writes a complete session-local handoff artifact.

Required artifact path:

- `.directive-cli/directives/<session_dir>/<directive_slug>.handoff.json`

Required `<directive_slug>.handoff.json` format:

```json
{
  "handoff": {
    "from_role": "<architect|executor|pair|auditor>",
    "to_role": "<architect|executor|pair|auditor>",
    "trigger": "<short deterministic trigger id>",
    "session_id": "<directive session UUID from <directive_slug>.meta.json meta.id or null>",
    "task_file": "<task path or null>",
    "directive_branch": "<non empty git branch name>",
    "required_reading": "apps/web/docs/guides/component-paradigm.md",
    "objective": "<one line objective for receiving role>",
    "blocking_rule": "<rule that prevents sender from continuing>",
    "worktree_mode": "<clean_required|known_dirty_allowlist>",
    "worktree_allowlist_paths": []
  }
}
```

Directive execution rule:

- For any handoff that leads to directive execution, `handoff.directive_branch` must be present and be a non empty git branch name.
- `handoff.directive_branch` must match session metadata `meta.directive_branch` when `handoff.session_id` points at a directive session.
- `handoff.worktree_mode` must be explicit for directive execution handoffs:
  - `clean_required`: execution requires clean working tree before edits.
  - `known_dirty_allowlist`: execution may proceed only when dirty paths match `worktree_allowlist_paths` exactly.
- For `clean_required`, set `handoff.worktree_allowlist_paths: []`.
- For `known_dirty_allowlist`, `handoff.worktree_allowlist_paths` must be a non empty JSON array of exact relative paths.

Rules:

- Chat handoffs are not allowed.
- Receiver must treat `<directive_slug>.handoff.json` as the sole handoff source of truth.
- `handoff.directive_branch` must match session metadata `meta.directive_branch`.
- `handoff.worktree_mode` must be present for directive execution handoffs.
- If `handoff.worktree_mode` is `known_dirty_allowlist`, `handoff.worktree_allowlist_paths` must be present and non empty.
- If `handoff.worktree_mode` is `clean_required`, `handoff.worktree_allowlist_paths` must be `[]`.
- If `<directive_slug>.handoff.json` is missing, incomplete, or mismatched, Executor must stop.

## Sender behavior

When a handoff trigger is met, sender must:

1. stop execution immediately
2. write one complete `<directive_slug>.handoff.json` artifact
3. avoid additional discretionary work after artifact write

## Receiver behavior

When a valid `<directive_slug>.handoff.json` targets receiver role:

1. treat target role as explicitly selected
2. complete required reading
3. continue execution without requesting manual role re-selection
4. use `handoff.session_id` and `handoff.task_file` to continue directly
5. verify current git branch matches `handoff.directive_branch` before any edits
6. when handoff context resolves execution target, do not request additional operator confirmation prompts before starting execution

If `<directive_slug>.handoff.json` is incomplete or malformed, receiver must stop and request correction.

## No-manual-confirmation mode

For trigger-based handoffs defined in this module, role transition should not require additional operator confirmation.

Operator may still interrupt or override at any time.

TTY transition clarification:

- Automatic handoff applies to artifact and role context (`<directive_slug>.handoff.json` and startup context), not guaranteed in-process CLI reattachment.
- If launch command is running in a non-interactive environment, sender must instruct operator to:
  1. exit current Codex session
  2. run `dc launch handoff --role <receiver> --from-role <sender> --profile <profile> --directive <session>` from a real terminal (TTY)

## Trigger matrix

1. Architect to Executor
- trigger: `architect_ultra_detected`
- condition: any non archived session with `meta.session_priority: ultra`

2. Auditor to Executor
- trigger: `auditor_ultra_open`
- condition: ultra priority enforcement task requires execution role

3. Executor to Architect
- trigger: `executor_scope_or_contract_block`
- condition: allowlist conflict, missing deterministic step detail, or unresolved deviation decision

4. Pair to Architect
- trigger: `pair_out_of_scope`
- condition: requested change exceeds `apps/web` cleanup boundary or requires backend, route, or data model decisions

5. Any role to Architect
- trigger: `role_policy_conflict`
- condition: instruction conflict cannot be resolved inside active role constraints

```

## Source: .directive-cli/docs/agent-rules/auditor/README.md

```markdown
# Auditor Rules Modules

Status: active
Canonical source for Auditor role behavior.
Runtime-operational behavior is policy-enforced from `.directive-cli/policies/*.json` and lifecycle scripts.

## Mandatory prerequisites

Read shared modules first:

1. `.directive-cli/docs/agent-rules/shared/critical-enforcement.md`
2. `.directive-cli/docs/agent-rules/shared/role-handoff-automation.md`
3. `.directive-cli/docs/agent-rules/shared/baseline-and-safety.md`
4. `.directive-cli/docs/agent-rules/shared/directives-model.md`

## Role modules

1. `purpose-and-ultra-priority.md`
2. `startup-and-discovery.md`
3. `boundaries-and-stop.md`

```

## Source: .directive-cli/docs/agent-rules/auditor/boundaries-and-stop.md

```markdown
# Boundaries And Stop

## Branch and execution boundaries

- Auditor uses feature branch created by Architect.
- Auditor must not create, rename, or close branches.
- Auditor must stay within audit scope and task allowlist.

## Stop conditions

Auditor must stop if:

- required file is missing
- change exceeds directive allowlist
- validation cannot be completed as specified
- ambiguity could affect correctness

```

## Source: .directive-cli/docs/agent-rules/auditor/purpose-and-ultra-priority.md

```markdown
# Purpose And Ultra Priority

## Role purpose

Auditor performs audit enforcement and remediation inside explicit audit scope.

## Core boundary

Auditor must not introduce unrelated product changes.

## Ultra priority authority

- Auditor is the only role allowed to create `session_priority: ultra`.
- Only one `ultra` session may be open at a time.
- While `ultra` is open, other session work is blocked.
- When `ultra` is open and execution is required, Auditor must write `<directive_slug>.handoff.json` for Executor using `trigger: auditor_ultra_open`.

## Ultra auto run constraint

If Auditor creates ultra priority auto run session:

- set session `meta.auto_run: true`
- create exactly one task
- set task `meta.auto_run: true`

```

## Source: .directive-cli/docs/agent-rules/auditor/startup-and-discovery.md

```markdown
# Startup And Discovery

## Startup actions

0. If startup context from `dc launch codex` (or `dc context start`) already provides role and selected directive/task, skip manual role confirmation and broad session discovery; proceed directly with that context.
1. Confirm role assignment and required reading.
2. List non archived sessions in numbered form.
3. If unrelated `ultra` session exists, stop and request direction.
4. If Auditor created `ultra` auto run session, proceed immediately.
5. Validate selected task contract before edits.
6. Restate objective and request operator confirmation before implementation.

## Discovery rules

Auditor executes either:

- specific task path provided by operator, or
- single auto run task created by Auditor

```

## Source: .codex/context/dc.commands.json

```json
{
  "kind": "dc_command_reference",
  "schema_version": "1.0",
  "generated_at": "2026-02-15T17:37:29.604Z",
  "policy": {
    "no_guessing": true,
    "help_on_ambiguity": [
      "dc help",
      "dc <category> --help",
      "dc <category> <command> --help"
    ],
    "scripted_actions_only": true,
    "require_operator_go_ahead_before_execution": true
  },
  "audiences": {
    "operator_only": [
      "dc init",
      "dc directive new",
      "dc context build",
      "dc context bootstrap",
      "dc launch codex",
      "dc launch switch"
    ],
    "operator_and_machine": [
      "dc codex usage",
      "dc repo map",
      "dc directive view",
      "dc directive archive",
      "dc directive merge",
      "dc directive migrate",
      "dc validate",
      "dc test",
      "dc help",
      "dc context check",
      "dc context show",
      "dc launch handoff"
    ],
    "machine_only": [
      "dc policy validate",
      "dc runbook executor-task-cycle",
      "dc runbook executor-directive-closeout",
      "dc runbook executor-directive-cleanup",
      "dc runbook architect-authoring",
      "dc directive task",
      "dc directive handoff",
      "dc directive start",
      "dc task start",
      "dc task finish",
      "dc directive finish",
      "dc directive archive",
      "dc directive merge",
      "dc directive cleanup",
      "dc meta update",
      "dc meta architect",
      "dc meta executor"
    ]
  },
  "commands": {
    "directive": [
      "dc directive new",
      "dc directive task",
      "dc directive handoff",
      "dc directive view",
      "dc directive archive",
      "dc directive merge",
      "dc directive start",
      "dc directive finish",
      "dc directive cleanup",
      "dc directive migrate"
    ],
    "task": [
      "dc task start",
      "dc task finish"
    ],
    "meta": [
      "dc meta update",
      "dc meta architect",
      "dc meta executor"
    ],
    "runbook": [
      "dc runbook executor-task-cycle",
      "dc runbook executor-directive-closeout",
      "dc runbook executor-directive-cleanup",
      "dc runbook architect-authoring"
    ],
    "utility": [
      "dc codex usage",
      "dc validate",
      "dc test",
      "dc policy validate",
      "dc repo map"
    ],
    "context": [
      "dc context build",
      "dc context check",
      "dc context show",
      "dc context bootstrap"
    ],
    "launch": [
      "dc launch codex",
      "dc launch switch",
      "dc launch handoff"
    ]
  }
}

```

