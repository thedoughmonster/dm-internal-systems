create extension if not exists pgcrypto;

create table if not exists public.curbside_checkins (
  id uuid primary key default gen_random_uuid(),
  toast_order_guid text not null,
  occurred_at timestamptz not null default now(),
  order_found boolean not null,
  ip text null,
  user_agent text null,
  db_error text null,
  created_at timestamptz not null default now()
);
