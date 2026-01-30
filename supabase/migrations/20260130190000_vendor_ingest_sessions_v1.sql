create table if not exists public.vendor_ingest_sessions (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  vendor_id uuid not null references public.vendors(id) on delete restrict,
  handler_id text not null,
  filename text null,
  proposed jsonb not null,
  confirm_meta jsonb not null,
  write_summary jsonb not null,
  audit jsonb not null,
  vendor_invoice_id uuid null references public.vendor_invoices(id) on delete set null
);

create index if not exists vendor_ingest_sessions_vendor_id_created_at_idx
  on public.vendor_ingest_sessions (vendor_id, created_at desc);

create index if not exists vendor_ingest_sessions_handler_id_created_at_idx
  on public.vendor_ingest_sessions (handler_id, created_at desc);

create index if not exists vendor_ingest_sessions_vendor_invoice_id_idx
  on public.vendor_ingest_sessions (vendor_invoice_id);

alter table public.vendor_ingest_sessions enable row level security;

create policy vendor_ingest_sessions_service_role_all
  on public.vendor_ingest_sessions
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create policy vendor_ingest_sessions_authenticated_select
  on public.vendor_ingest_sessions
  for select
  using (auth.role() = 'authenticated');
