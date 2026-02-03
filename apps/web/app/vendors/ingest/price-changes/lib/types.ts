export type PriceChangeRow = {
  vendor_catalog_item_id: string
  vendor_sku: string | null
  description: string | null
  latest_invoice_date: string
  latest_price_cents: number
  previous_invoice_date: string
  previous_price_cents: number
  delta_cents: number
  delta_percent: number
}

export type PriceChangeSeriesPoint = {
  invoiceDate: string
  averagePriceCents: number
}

export type PriceChangeSeries = Record<string, PriceChangeSeriesPoint[]>
