# Actor References

## Purpose
This directory contains human-readable actor reference documentation.

## Contents
- `docs/reference/actors/dm-actor-model-v1.md`

## Source of truth
- Actor data contract: `contracts/actors/dm_actor_model_v1.json`
- Actor schema: `contracts/actors/dm_actor_model_v1.schema.json`
- Actor instances: `contracts/actors/dm_actors_v1.json`

## Actor append workflow
- Intake payload: `ops_tooling/updates/actors_inbox/dm_actors_v1.src.json`
- Validation and append script: `ops_tooling/scripts/actors_append_validated.py`
- Duplicate prevention is name-based and append-only.
- Validate-only mode performs validation without writes and is used in CI.
