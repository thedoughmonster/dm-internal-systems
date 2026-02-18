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
  observationCount: number
  firstInvoiceDate: string
  lastInvoiceDate: string
}

export type PriceChangeSeriesGranularity = "day" | "week" | "month"

export type PriceChangeSeriesItem = {
  observationCount: number
  firstInvoiceDate: string | null
  lastInvoiceDate: string | null
  points: PriceChangeSeriesPoint[]
}

export type PriceChangeSeriesResponse = {
  vendorId: string
  granularity: PriceChangeSeriesGranularity
  range: {
    startDate: string
    endDate: string
    days: number
    usedDefaultWindow: boolean
  }
  itemCount: number
  items: Record<string, PriceChangeSeriesItem>
}

export type PriceChangeSeries = Record<string, PriceChangeSeriesPoint[]>

export type PriceChangeRankingMetric =
  | "percent_swing"
  | "absolute_swing"
  | "volatility"
  | "recent_movers"
  | "freshness"

export type PriceChangeSeriesGranularityOption = PriceChangeSeriesGranularity

export type PriceChangeRecentFilter = "all" | "movers_only"

export type PriceChangeFreshnessFilter = "all" | "7" | "14" | "30" | "60" | "90"

export type PriceChangeDrilldownSelection = {
  vendorId: string
  itemId: string
}

export type PriceChangeDrilldownMetrics = {
  observationCount: number
  minPriceCents: number
  maxPriceCents: number
  averagePriceCents: number
  absoluteSwingCents: number
  percentSwing: number
  volatilityScore: number
  netChangeCents: number
  netChangePercent: number
}
