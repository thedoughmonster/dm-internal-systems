# lifecycle_exempt intake

## Purpose
lifecycle_exempt is for intake, inbox, and helper artifacts.
These artifacts are inputs to scripts, not authoritative documents.

## What lifecycle_exempt is NOT
- Not canonical
- Not lifecycle governed
- Not required to have companion MD files
- Not safe for agent consumption

## Relationship to canon
Artifacts here may be read by approved scripts.
Scripts may produce or mutate lifecycle governed documents under docs/canon/.
Humans must not treat lifecycle_exempt artifacts as source of truth.

## Example
inbox_actors/dm_actors_v1.src.json is an intake payload that is validated and then applied elsewhere.

## Replay guardrail
Intake payloads can be applied into canon by approved scripts.
After a successful non-validate apply, the actors intake file is cleared back to { "actors": [] }.
This prevents accidental repeated application of the same payload.
Validate-only runs never clear or mutate intake files.

## Authority reminder
document_lifecycle_v1.json is the source of truth.
This README exists to aid humans only.
