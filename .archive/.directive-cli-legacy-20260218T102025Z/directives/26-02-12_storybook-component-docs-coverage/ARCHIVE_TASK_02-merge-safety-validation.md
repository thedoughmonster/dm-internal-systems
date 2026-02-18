---
meta:
  title: "Merge-safety validation: Storybook component docs coverage"
  status: archived
  priority: high
  session_priority: high
  owner: operator
  assignee: executor
  bucket: todo
  created: 2026-02-12T10:10:00Z
  updated: 2026-02-12T10:10:00Z
  tags: [storybook, ui, validation]
  effort: small
  depends_on: []
  blocked_by: []
  related: []
  summary: "Archived: replaced by TASK_00 through TASK_09 full normalization collection."
  execution_model: gpt-5.2-codex
  thinking_level: medium
---

## Objective

Provide merge-safety evidence for the Storybook docs sweep.

## Constraints

- No file edits expected in this task.

## Allowed files

- No file edits expected.

## Steps

1. Run lint and typecheck.
2. Run Storybook smoke-test and CI build.

## Validation

```bash
npm --prefix apps/web run lint
npm --prefix apps/web run typecheck
npm --prefix apps/web run storybook -- --ci --smoke-test
npm --prefix apps/web run storybook:build:ci
```

## Expected output

- Lint and typecheck pass.
- Storybook smoke-test and CI build complete successfully.

## Stop conditions

- Stop and ask operator if validations fail due to unrelated, pre-existing issues.

