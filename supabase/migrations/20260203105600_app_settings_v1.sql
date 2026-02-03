create table if not exists app_settings (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz not null default now()
);

alter table app_settings enable row level security;

create policy app_settings_select_anon_authenticated
  on app_settings
  for select
  to anon, authenticated
  using (true);

create policy app_settings_service_role_all
  on app_settings
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

create trigger app_settings_set_updated_at
before update on app_settings
for each row
execute function public.set_updated_at_timestamp();
