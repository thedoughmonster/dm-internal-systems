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
The intake example is docs/lifecycle_exempt/inbox_actors/dm_actors_v1.src.json.

## Consumers
CI workflows validate changes.
Agents may read canonical docs, but should not read lifecycle_exempt intake artifacts.

## Authority reminder
docs/document_lifecycle_v1.json is the source of truth.
This README exists to help humans understand the layout.
