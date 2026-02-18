# Database and Migrations Standard

## Rules

- Keep migrations deterministic, ordered, and reviewable.
- Prefer backward-compatible migration paths unless a coordinated breaking change is approved.
- Validate migration effects in test environment before production release.
- Keep schema changes and dependent application changes synchronized.
