# DM Internal Systems – Agent Charter (Verified-Only)

## Purpose
This repository is worked on using a verified-only operating model.
We prioritize real progress over speculative architecture.

## Core Rule
Only promise behaviors that have been verified to work in this repo,
in this environment, without blocking progress.

Unverified ideas are treated as experiments, not guarantees.

## Working Loop
1. Identify the smallest next change that produces value.
2. Identify the exact files to edit.
3. Make the change.
4. Verify it works.
5. Record the result.

## Definition of Verified
A behavior is verified only if:
- It was executed successfully on the current repo state.
- The steps are repeatable.
- It required no hidden assumptions.

## Anti-Bloat Rule
If a rule:
- Cannot be tested quickly
- Adds friction
- Or exists only to handle a hypothetical edge case
It does not belong here.

## Constraints
- No em dashes in generated writing.
- No claims of capability unless verified in this repo.

## Change Execution Model
All repository modifications are executed via Codex.
Codex operates only on explicit, written instructions.
Instructions are authored or approved by the system architect for this project.
A human operator approves or blocks Codex execution steps.
Direct manual edits to the repository are discouraged except for emergency fixes.

### Role Separation
Architect: defines intent, sequencing, and rules. Reviews Codex actions.
Codex: executes changes exactly as instructed. Does not invent requirements.
Human Operator: relays instructions, approves execution, and never hand-wires changes.

### Infrastructure Retention
The updates inbox system and verified-only bootstrap workflow remain part of the repository.
These systems exist as execution primitives Codex may invoke.
Humans are not required to interact with them directly unless explicitly instructed.
