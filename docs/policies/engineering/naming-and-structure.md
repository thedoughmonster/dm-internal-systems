# Naming and Structure Standard

## Rules

- Use stable, descriptive names for files, functions, components, routes, and migrations.
- Keep naming conventions consistent within each surface (UI, API, DB, scripts).
- Prefer explicit names over abbreviations unless domain-standard.
- Use deterministic file placement and avoid ad-hoc utility sprawl.
- Code symbol naming baseline:
  - variables/functions: `camelCase`
  - module-level constants: `UPPER_CASE`
  - types/interfaces/enums/components: `PascalCase`
  - `snake_case` is allowed only when mirroring external payload/schema field names
