# Architecture and Boundaries Standard

## Rules

- Place code by concern: product code in `apps/web/`, backend runtime in `supabase/`, operations tooling in `ops_tooling/`.
- Keep dependency direction explicit; UI layer must not directly own infrastructure details.
- Avoid cross-layer shortcuts. Introduce adapters/interfaces where layer transitions are needed.
- Keep modules cohesive and limit file scope to one primary responsibility.
