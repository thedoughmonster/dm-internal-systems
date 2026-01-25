create table if not exists "dm"."_migration_smoke_test" (
  "id" bigserial primary key,
  "note" text not null,
  "created_at" timestamptz not null default now()
);

comment on table "dm"."_migration_smoke_test" is 'Smoke test table to verify Supabase migration pipeline.';
