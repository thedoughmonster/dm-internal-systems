create or replace function vendor_price_changes_v1(
  p_vendor_id uuid,
  p_days int default 28,
  p_min_percent_change numeric default 0.02
)
returns table(
  vendor_catalog_item_id uuid,
  vendor_sku text,
  description text,
  latest_invoice_date date,
  latest_price_cents bigint,
  previous_invoice_date date,
  previous_price_cents bigint,
  delta_cents bigint,
  delta_percent numeric
)
language sql
stable
as $$
with invoice_averages as (
  select
    vil.vendor_catalog_item_id,
    vi.invoice_date as invoice_date,
    avg(vil.unit_price_cents)::bigint as avg_price_cents
  from vendor_invoice_lines vil
  join vendor_invoices vi on vi.id = vil.vendor_invoice_id
  where vi.vendor_id = p_vendor_id
    and vi.invoice_date >= (current_date - p_days)
    and vil.vendor_catalog_item_id is not null
    and vil.unit_price_cents is not null
  group by vil.vendor_catalog_item_id, vi.invoice_date
),
ranked as (
  select
    vendor_catalog_item_id,
    invoice_date,
    avg_price_cents,
    row_number() over (
      partition by vendor_catalog_item_id
      order by invoice_date desc
    ) as rn
  from invoice_averages
),
latest as (
  select * from ranked where rn = 1
),
previous as (
  select * from ranked where rn = 2
)
select
  latest.vendor_catalog_item_id,
  vci.vendor_sku,
  vci.description,
  latest.invoice_date as latest_invoice_date,
  latest.avg_price_cents as latest_price_cents,
  previous.invoice_date as previous_invoice_date,
  previous.avg_price_cents as previous_price_cents,
  (latest.avg_price_cents - previous.avg_price_cents) as delta_cents,
  (latest.avg_price_cents - previous.avg_price_cents)::numeric / previous.avg_price_cents as delta_percent
from latest
join previous on previous.vendor_catalog_item_id = latest.vendor_catalog_item_id
join vendor_catalog_items vci on vci.id = latest.vendor_catalog_item_id
where previous.avg_price_cents is not null
  and previous.avg_price_cents <> 0
  and abs((latest.avg_price_cents - previous.avg_price_cents)::numeric / previous.avg_price_cents) >= p_min_percent_change
order by abs((latest.avg_price_cents - previous.avg_price_cents)::numeric / previous.avg_price_cents) desc;
$$;
