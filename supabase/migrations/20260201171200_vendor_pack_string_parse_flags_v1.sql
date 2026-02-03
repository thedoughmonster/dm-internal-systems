create table if not exists public.vendor_pack_string_parse_flags (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  pack_string_normalized text not null,
  flag_type text not null,
  created_at timestamptz not null default now(),
  evidence jsonb null
);

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'vendor_pack_string_parse_flags_vendor_id_pack_string_normalized_key'
  ) then
    alter table public.vendor_pack_string_parse_flags
      add constraint vendor_pack_string_parse_flags_vendor_id_pack_string_normalized_key
      unique (vendor_id, pack_string_normalized);
  end if;
end $$;

create index if not exists vendor_pack_string_parse_flags_vendor_id_pack_string_normalized_idx
  on public.vendor_pack_string_parse_flags (vendor_id, pack_string_normalized);

alter table public.vendor_pack_string_parse_flags enable row level security;

create policy vendor_pack_string_parse_flags_service_role_all
  on public.vendor_pack_string_parse_flags
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy vendor_pack_string_parse_flags_authenticated_select
  on public.vendor_pack_string_parse_flags
  for select
  using (auth.role() = 'authenticated');

create or replace function public.vendor_pack_unmapped_queue_v1(p_limit int default 50)
returns table (
  vendor_id uuid,
  vendor_key text,
  pack_string_normalized text,
  line_count int,
  raw_samples text[],
  vendor_invoice_id uuid,
  vendor_invoice_number text,
  invoice_date date,
  vendor_sku text,
  description text,
  pack_string_raw text
)
language sql
as $$
  with raw_lines as (
    select
      vi.vendor_id,
      v.vendor_key,
      vi.id as vendor_invoice_id,
      vi.vendor_invoice_number,
      vi.invoice_date,
      vil.vendor_sku,
      vil.description,
      nullif(btrim(vil.raw->>'pack_size_text'), '') as pack_string_raw
    from vendor_invoice_lines vil
    join vendor_invoices vi on vi.id = vil.vendor_invoice_id
    join vendors v on v.id = vi.vendor_id
  ),
  normalized as (
    select
      *,
      public.normalize_pack_string_v1(pack_string_raw) as pack_string_normalized
    from raw_lines
    where pack_string_raw is not null
  ),
  filtered as (
    select *
    from normalized
    where pack_string_normalized <> ''
  ),
  grouped as (
    select
      vendor_id,
      vendor_key,
      pack_string_normalized,
      count(*)::int as line_count,
      array_agg(distinct pack_string_raw order by pack_string_raw) as raw_samples
    from filtered
    group by vendor_id, vendor_key, pack_string_normalized
  ),
  unmapped as (
    select g.*
    from grouped g
    left join vendor_pack_string_parses vps
      on vps.vendor_id = g.vendor_id
     and vps.pack_string_normalized = g.pack_string_normalized
    left join vendor_pack_string_parse_flags vpsf
      on vpsf.vendor_id = g.vendor_id
     and vpsf.pack_string_normalized = g.pack_string_normalized
    where vps.id is null
      and vpsf.id is null
  ),
  sample_lines as (
    select
      f.*,
      row_number() over (
        partition by f.vendor_id, f.pack_string_normalized
        order by f.vendor_invoice_id
      ) as rn
    from filtered f
  )
  select
    u.vendor_id,
    u.vendor_key,
    u.pack_string_normalized,
    u.line_count,
    (u.raw_samples)[1:3] as raw_samples,
    s.vendor_invoice_id,
    s.vendor_invoice_number,
    s.invoice_date,
    s.vendor_sku,
    s.description,
    s.pack_string_raw
  from unmapped u
  join sample_lines s
    on s.vendor_id = u.vendor_id
   and s.pack_string_normalized = u.pack_string_normalized
   and s.rn = 1
  order by u.line_count desc
  limit least(greatest(p_limit, 1), 200);
$$;

