create table if not exists public.vendor_pack_string_parses (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  pack_string_raw text not null,
  pack_string_normalized text not null,
  pack_qty numeric not null,
  pack_uom text not null,
  pack_size numeric not null,
  pack_size_uom text not null,
  verified_at timestamptz not null default now(),
  verified_by text null,
  evidence jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendor_pack_string_parses_vendor_id_pack_string_normalized_key'
  ) then
    alter table public.vendor_pack_string_parses
      add constraint vendor_pack_string_parses_vendor_id_pack_string_normalized_key
      unique (vendor_id, pack_string_normalized);
  end if;
end $$;

create index if not exists vendor_pack_string_parses_vendor_id_pack_string_normalized_idx
  on public.vendor_pack_string_parses (vendor_id, pack_string_normalized);

alter table public.vendor_pack_string_parses enable row level security;

create policy vendor_pack_string_parses_service_role_all
  on public.vendor_pack_string_parses
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy vendor_pack_string_parses_authenticated_select
  on public.vendor_pack_string_parses
  for select
  using (auth.role() = 'authenticated');

drop trigger if exists vendor_pack_string_parses_set_updated_at
  on public.vendor_pack_string_parses;

create trigger vendor_pack_string_parses_set_updated_at
  before update on public.vendor_pack_string_parses
  for each row
  execute function public.set_updated_at_timestamp();
