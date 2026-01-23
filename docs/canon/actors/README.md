# Canonical actors

## Purpose
This directory contains lifecycle-governed canonical actor artifacts.

## Contents
- dm_actor_model_v1.json
- dm_actor_model_v1.schema.json
- DM_ACTOR_MODEL_V1.MD
- dm_actors_v1.json

## Production and updates
Canonical files are not edited directly in canonical states.
Updates flow from lifecycle_exempt intake through approved scripts.
The intake example is updates/actors_inbox/dm_actors_v1.src.json.

## Consumers
CI workflows validate changes.
Agents may read canonical docs, but should not read lifecycle_exempt intake artifacts.

## Actor append workflow
The intake payload lives at updates/actors_inbox/dm_actors_v1.src.json.
The payload shape is { "actors": [ ... ] }.
Validation runs through scripts/actors_append_validated.py.
The canonical target is docs/canon/actors/dm_actors_v1.json.
Duplicate prevention is name based and append only.
Validate-only mode performs validation without writes, and CI uses validate-only.
A successful append clears the intake payload to prevent replays.

## Authority reminder
docs/document_lifecycle_v1.json is the source of truth.
This README exists to help humans understand the layout.
