# Baseline And Safety

## Baseline anchors

All roles follow baseline policy defined in `.directive-cli/AGENTS.md`.

- verified only operating model
- changelog requirements when applicable
- role assignment and required reading protocol
- secret handling and redaction policy

## Data access policy

- All UI reads and writes go through Edge Functions.
- Direct Supabase REST calls from UI code are forbidden.
- Approved local exception: `/directives` UI may read and write `.directive-cli/directives/` directly for local use.

## Migration naming policy

- Migration filename format: `YYYYMMDDhhmmss_description.sql`
- `T` and `Z` are not allowed in migration filenames.
