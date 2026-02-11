# Document Lifecycle Specification v1

## Authority

This document defines the governing lifecycle for all canonical documents in this repository.

No SOP, generator, agent, or workflow may override or bypass this specification.

---

## What Is a Document

A document is a paired artifact consisting of:

- A machine canonical JSON file
- A human companion Markdown file

Both are mandatory.
Neither may exist alone.
State applies to the pair.

---

## Roles of Each File

### JSON

The JSON file is the enforcement layer.

It defines:
- Required structure
- Allowed behavior
- Valid state
- Agent enforceable rules

Agents must treat JSON as law.

### Markdown

The Markdown file is the explanation layer.

It exists to:
- Explain intent
- Provide rationale
- Clarify usage
- Assist human understanding

Markdown may not introduce rules or requirements.
If Markdown conflicts with JSON, the JSON is correct and execution must stop.

---

## Lifecycle States

Every document pair exists in exactly one state:

- draft
- validated
- canonical
- locked
- deprecated

State is enforced through file location, permissions, and validation history.
State is never inferred.

---

## State Summary

### Draft
- Freely editable
- Not authoritative
- Not usable by agents

### Validated
- Schema valid
- Stable
- Not yet authoritative

### Canonical
- Source of truth
- Read only
- Referenced by agents

### Locked
- Immutable historical record
- Audit only

### Deprecated
- Explicitly obsolete
- Retained for history
- Must not be referenced

---

## Transitions

Only these transitions are allowed:

- draft to validated
- validated to canonical
- canonical to locked
- canonical to deprecated

Downgrades are forbidden.

---

## Mutation Rules

Canonical truth is never edited in place.

All changes require:
1. Copy forward to a new version
2. Re entry at draft
3. Full lifecycle replay

Humans do not edit truth.

---

## Path Governance

The docs top level is reserved for lifecycle authority documents only.

Lifecycle governed documents live under docs/canon/.

Lifecycle exempt artifacts live under docs/lifecycle_exempt/.

Lifecycle rules do not apply under docs/lifecycle_exempt/.

---

## Enforcement

If any tool, agent, or human action violates this lifecycle:
- Execution must stop
- The violation must be reported
- No best effort behavior is allowed

Silence is not permission.

---

## Final Principle

Machines enforce truth.
Humans require explanation.

Both are mandatory.
Only one is authoritative.
