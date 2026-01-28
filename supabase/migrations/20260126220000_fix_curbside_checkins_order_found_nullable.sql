alter table public.curbside_checkins
  alter column order_found drop not null;

alter table public.curbside_checkins
  alter column order_found set default false;
