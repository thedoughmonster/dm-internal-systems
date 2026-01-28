# Identifier Framework V0

## Purpose
Provide deterministic file identification for vendor ingestion. The goal is to map incoming files to a vendor, document type, and format version before ingestion handlers run.

## Extracted signatures
The framework extracts a lightweight signature from the CSV text:
- HFP record structure detection based on record type tokens.
- F record field list from the first F record in HFP files.
- Header row token list for non HFP files.

Each token is normalized by trimming, collapsing whitespace, and uppercasing.

## Identifier behavior
Identifiers use strict equality on ordered, normalized fields. There is no fuzzy matching. This allows deterministic behavior and avoids accidental cross matches across vendors.

## Status meanings
- MATCH: The identifier recognizes the file and is confident in the format.
- NO_MATCH: The identifier does not recognize the file.
- INCOMPATIBLE: The file shares a structure with the identifier but the fields do not match the expected version.

## Adding a new identifier
1. Create a new file under `supabase/functions/vendor_ingest/identifier_functions/`.
2. Export a constant that implements `IdentifierFunction`.
3. Use the extracted signature to compare against a locked, ordered field list.
4. Return MATCH only on exact field equality and include reasons and warnings.
5. Add the identifier to the stable `IDENTIFIERS` array in `supabase/functions/vendor_ingest/identify.ts`.

## Ambiguity handling
`runIdentification` evaluates all identifiers in order. It selects a proposed match only when the result is unambiguous:
- A single high confidence match produces PROPOSED_MATCH.
- Multiple high confidence matches produce AMBIGUOUS_MATCH with candidates.
- If there are no high matches and exactly one medium match, it produces PROPOSED_MATCH.
- All other cases produce UNKNOWN_FORMAT.
