# Directive CLI Reference

This is the canonical operator and agent reference for `dc`.

## Core answers

### Does executor commit and merge back to `dev` automatically?

- Commit: yes, based on `commit_policy` in directive meta.
- Push: yes, on task/directive finish (policy controlled).
- Merge to `dev`: yes, when using runbook closeout.
- Canonical final step is `dc runbook executor-directive-closeout`, which performs:
  - QA gate prompt
  - `dc directive finish`
  - checkout `dev`
  - `dc directive archive` (merge)
  - `dc directive cleanup` (remove merged feature branch)

Rationale:

- Keep execution deterministic per task.
- Avoid silent cross-branch merges during active execution.
- Keep merge/closeout as explicit lifecycle intent.

## Lifecycle map

### Architect flow

1. `dc directive new`
2. `dc directive task` (repeat per task)
3. `dc meta architect ...` (set directive/task metadata)
4. `dc validate --strict`
5. `dc directive handoff --session <s> --task-file <task>.task.json ...`
6. `dc launch handoff` (operator runs from TTY)

### Executor flow

1. `dc launch handoff` (task-bound handoff required)
2. `dc directive start --session <s>`
3. `dc task start --session <s> --task <t>`
4. implement task
5. `dc task finish --session <s> --task <t> --summary "..."`
6. repeat tasks
7. `dc runbook executor-directive-closeout --session <s> --confirm executor-directive-closeout`

## Command catalog

### Top level

- `dc help [--all|--op|--agents]`
- `dc codex usage [--hours <n>|--since <iso>|--until <iso>] [--json]`
- `dc test`
- `dc validate [--strict] [--verbose] [--file ...]`
- `dc repo map`
- `dc policy validate`
  - Also validates role-home `.rules` behavior (executor: raw `git` => `forbidden`, required lifecycle command shapes => `allow`).
- `dc ns show|env|enter|clear`

### Launch/context

- `dc launch codex`
- `dc launch switch`
- `dc launch handoff [--directive <s>] [--task <t>]`
- `dc context build|check|show|bootstrap|start|switch|handoff`

Launch profile wiring:

- Launch commands do not rewrite profile config by default.
- Use `--bootstrap` when you want launch to write/refresh role profile wiring.

Role-home mapping:

- `dc` can resolve codex home per role from `.codex/dc.config.json`:
  - `homes.architect`
  - `homes.executor`
  - `homes.pair`
  - `homes.auditor`
  - optional `homes.default`
- `--codex-home` still overrides config mapping.

### Directive

- `dc directive new`
- `dc directive task`
- `dc directive handoff`
- `dc directive list`
- `dc directive view`
- `dc directive start --session <s>`
- `dc directive finish --session <s>`
- `dc directive archive`
- `dc directive merge`
- `dc directive cleanup`
- `dc directive migrate`

### Task

- `dc task start --session <s> --task <t>`
- `dc task finish --session <s> --task <t> --summary "..."`

### Metadata

- `dc meta update ...`
- `dc meta architect ...`
- `dc meta executor ...`

### Runbook

- `dc runbook executor-task-cycle --session <s> --task <t> --phase pre|post ...`
- `dc runbook executor-directive-closeout --session <s> --confirm executor-directive-closeout [--qa-command "..."] [--qa-status pass|fail|skip]`
- `dc runbook executor-directive-cleanup --session <s> ...`
- `dc runbook architect-authoring ...`

## Required invariants

### Handoff invariants

- Each directive has its own `<directive_slug>.handoff.json`.
- Executor handoff must include a concrete `task_file` (not `null`).
- `directive_branch` in handoff must match directive meta.

### Execution invariants

- Use lifecycle scripts, not ad-hoc shell flow.
- Respect clean-tree/scope gates.
- Use directive/task metadata as source of truth.

## Common failures and exact fixes

### `Handoff ... does not select a task`

Fix:

- regenerate handoff with task:
  `dc directive handoff --session <s> --task-file <task>.task.json ...`
- or launch with explicit task:
  `dc launch handoff --directive <s> --task <task-slug>`

### `Missing --session` / `Missing --task` on lifecycle commands

Fix:

- always pass explicit identifiers:
  - `dc directive start --session <s>`
  - `dc task start --session <s> --task <t>`
  - `dc task finish --session <s> --task <t> --summary "..."`

### Dirty-tree scope gate blocks finish/start

Fix:

- complete/stage in-scope work or resolve out-of-scope changes.
- generated context/log files are tolerated by lifecycle guard, but real out-of-scope edits are blocked.

### Need token usage by time window

Use:

- `dc codex usage --hours 24`
- `dc codex usage --since 2026-02-14T00:00:00Z --until 2026-02-15T00:00:00Z --json`

Notes:

- Data source is `~/.codex/log/codex-tui.log`.
- Values are derived from observed `total_usage_tokens` deltas per `thread_id` in the selected window.

### Archived directive still has unmerged feature branch

Fix:

- merge branch via recovery command:
  `dc directive merge --session <s>`
- then cleanup merged branch:
  `dc directive cleanup --session <s>`

## Human vs machine usage

### Operator-first commands

- `dc launch codex`
- `dc launch switch`
- `dc directive new`
- `dc directive list`
- `dc directive view`
- `dc directive archive`
- `dc directive merge`

### Agent/lifecycle commands

- `dc directive start|finish|cleanup`
- `dc task start|finish`
- `dc meta architect|executor`
- `dc runbook ...`
- `dc validate`

## Practical rule for agents

Before edits:

1. run lifecycle start commands
2. run scoped implementation
3. run lifecycle finish commands
4. never bypass metadata/handoff contracts
