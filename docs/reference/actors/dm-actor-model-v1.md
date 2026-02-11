# System Map: Work Surfaces v0

This file explains the intent and usage of the canonical JSON schema:
- docs/dm_actor_model_v1.json
- docs/dm_actor_model_v1.schema.json

## What this is
The JSON defines a shared language for describing system actors and their relationship to the source of truth.
It is a schema, not an instance. Actors are later created as instances that conform to doc.schemas.actor.

## Why it exists
The goal is consistent architecture language before implementation details.
Every surface, feed, automation, or external system can be described with the same fields.

## Core fields
- types: What the actor is in the system.
- trust_level: How much structural trust we can assume about its output.
- signal_role: Whether it transmits, receives, or does both relative to truth.
- data_behavior: What it does with data.
- write_authority: How close it can get to truth.
- input_control: Whether the system owns the input shape or must ingest an external immutable shape.
- ingestion_middlemen: The adaptation and gating steps used only when input_control is external_immutable.

## Interpretation rules
- ingestion_middlemen compensate for inputs we do not control at the source.
- If input_control is owned_mutable, ingestion_middlemen should usually be ["none"].

## How to use
When adding a new actor to the architecture, create an actor instance that includes all required actor fields.
Flows can be defined later once actor instances exist.

## Non-goals
This schema does not define Supabase auth, RLS, table names, API paths, deployment details, or implementation constraints.
It is a classification map used to align architecture and guide later implementation.
