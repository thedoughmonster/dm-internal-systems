create extension if not exists pgcrypto;

create table if not exists vendors (
  id uuid primary key default gen_random_uuid(),
  vendor_key text not null unique,
  display_name text not null,
  created_at timestamptz not null default now()
);

create table if not exists vendor_catalog_items (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete restrict,
  vendor_sku text not null,
  vendor_sku_normalized text not null,
  description text null,
  brand text null,
  uom text null,
  pack_qty numeric null,
  pack_uom text null,
  pack_size numeric null,
  pack_size_uom text null,
  is_active boolean not null default true,
  source_updated_at timestamptz null,
  raw jsonb null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (vendor_id, vendor_sku_normalized)
);

create table if not exists vendor_invoices (
  id uuid primary key default gen_random_uuid(),
  vendor_id uuid not null references vendors(id) on delete restrict,
  vendor_invoice_number text not null,
  invoice_date date not null,
  location_key text null,
  currency text not null default 'USD',
  subtotal_cents bigint null,
  tax_cents bigint null,
  total_cents bigint null,
  raw jsonb null,
  created_at timestamptz not null default now(),
  unique (vendor_id, vendor_invoice_number)
);

create table if not exists vendor_invoice_lines (
  id uuid primary key default gen_random_uuid(),
  vendor_invoice_id uuid not null references vendor_invoices(id) on delete cascade,
  line_number int null,
  vendor_sku text null,
  vendor_sku_normalized text null,
  vendor_catalog_item_id uuid null references vendor_catalog_items(id) on delete set null,
  description text null,
  quantity numeric null,
  unit_price_cents bigint null,
  extended_price_cents bigint null,
  uom text null,
  pack_qty numeric null,
  pack_uom text null,
  pack_size numeric null,
  pack_size_uom text null,
  unmatched boolean not null default false,
  unmatched_reason text null,
  raw jsonb null,
  created_at timestamptz not null default now()
);

create index if not exists vendor_catalog_items_vendor_id_vendor_sku_normalized_idx
  on vendor_catalog_items (vendor_id, vendor_sku_normalized);
create index if not exists vendor_invoices_vendor_id_invoice_date_idx
  on vendor_invoices (vendor_id, invoice_date);
create index if not exists vendor_invoice_lines_vendor_invoice_id_idx
  on vendor_invoice_lines (vendor_invoice_id);
create index if not exists vendor_invoice_lines_vendor_catalog_item_id_idx
  on vendor_invoice_lines (vendor_catalog_item_id);
create index if not exists vendor_invoice_lines_unmatched_true_idx
  on vendor_invoice_lines (unmatched)
  where unmatched = true;

create or replace function public.set_updated_at_timestamp()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger vendor_catalog_items_set_updated_at
before update on vendor_catalog_items
for each row
execute function public.set_updated_at_timestamp();

alter table vendors enable row level security;
alter table vendor_catalog_items enable row level security;
alter table vendor_invoices enable row level security;
alter table vendor_invoice_lines enable row level security;

create policy vendors_service_role_all
  on vendors
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy vendors_authenticated_select
  on vendors
  for select
  using (auth.role() = 'authenticated');

create policy vendor_catalog_items_service_role_all
  on vendor_catalog_items
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy vendor_catalog_items_authenticated_select
  on vendor_catalog_items
  for select
  using (auth.role() = 'authenticated');

create policy vendor_invoices_service_role_all
  on vendor_invoices
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy vendor_invoices_authenticated_select
  on vendor_invoices
  for select
  using (auth.role() = 'authenticated');

create policy vendor_invoice_lines_service_role_all
  on vendor_invoice_lines
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy vendor_invoice_lines_authenticated_select
  on vendor_invoice_lines
  for select
  using (auth.role() = 'authenticated');

insert into vendors (vendor_key, display_name)
values ('sysco', 'Sysco')
on conflict (vendor_key) do nothing;
