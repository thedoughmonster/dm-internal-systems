create extension if not exists pgcrypto;

create table if not exists curbside_orders (
  id uuid primary key default gen_random_uuid(),
  toast_order_guid text not null unique,
  toast_restaurant_guid text null,
  order_payload jsonb not null,
  first_seen_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists curbside_orders_updated_at_idx on curbside_orders (updated_at);
