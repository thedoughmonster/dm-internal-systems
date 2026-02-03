create policy vendor_invoices_anon_select
  on vendor_invoices
  for select
  to anon
  using (true);

create policy vendor_invoice_lines_anon_select
  on vendor_invoice_lines
  for select
  to anon
  using (true);
