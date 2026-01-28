create table if not exists public.curbside_checkins (
  toast_order_guid text not null,
  ip text,
  user_agent text,
  occurred_at timestamptz not null default now(),
  constraint curbside_checkins_toast_order_guid_key unique (toast_order_guid)
);
