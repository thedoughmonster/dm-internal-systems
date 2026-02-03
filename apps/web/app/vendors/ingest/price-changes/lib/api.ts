import type {
  PriceChangeRow,
  PriceChangeSeries,
} from "./types"
import { buildApiUrl } from "@/lib/api-url"

type PriceChangeRowRaw = {
  vendor_catalog_item_id: string
  vendor_sku: string | null
  description: string | null
  latest_invoice_date: string
  latest_price_cents: number | string | null
  previous_invoice_date: string
  previous_price_cents: number | string | null
  delta_cents: number | string | null
  delta_percent: number | string | null
}


function toNumber(value: number | string | null, fallback = 0) {
  if (typeof value === "number") return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? fallback : parsed
  }
  return fallback
}

function normalizePriceChangeRows(rows: PriceChangeRowRaw[]): PriceChangeRow[] {
  return rows.map((row) => ({
    vendor_catalog_item_id: row.vendor_catalog_item_id,
    vendor_sku: row.vendor_sku,
    description: row.description,
    latest_invoice_date: row.latest_invoice_date,
    latest_price_cents: toNumber(row.latest_price_cents),
    previous_invoice_date: row.previous_invoice_date,
    previous_price_cents: toNumber(row.previous_price_cents),
    delta_cents: toNumber(row.delta_cents),
    delta_percent: toNumber(row.delta_percent),
  }))
}

export async function fetchPriceChanges(
  params: {
    vendorId: string
    days: number
    minPercentChange: number
  },
  baseUrl?: string | null
): Promise<PriceChangeRow[]> {
  const query = new URLSearchParams({
    vendorId: params.vendorId,
    days: params.days.toString(),
    minPercentChange: params.minPercentChange.toString(),
  })

  const response = await fetch(buildApiUrl(`/api/price-changes?${query.toString()}`, baseUrl ?? undefined), {
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to load price changes with ${response.status}: ${text}`)
  }

  const rows = (await response.json()) as PriceChangeRowRaw[]
  return normalizePriceChangeRows(rows)
}

export async function fetchDefaultVendorId(
  baseUrl?: string | null
): Promise<string | null> {
  const response = await fetch(buildApiUrl("/api/price-changes?mode=default-vendor", baseUrl ?? undefined), {
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to load default vendor with ${response.status}: ${text}`)
  }

  const payload = (await response.json()) as { vendorId?: string | null }
  return payload?.vendorId ?? null
}

export async function fetchPriceChangeSeries(
  params: {
    vendorId: string
    days: number
    itemIds: string[]
  },
  baseUrl?: string | null
): Promise<PriceChangeSeries> {
  if (params.itemIds.length === 0) {
    return {}
  }

  const query = new URLSearchParams({
    mode: "series",
    vendorId: params.vendorId,
    days: params.days.toString(),
    itemIds: params.itemIds.join(","),
  })

  const response = await fetch(buildApiUrl(`/api/price-changes?${query.toString()}`, baseUrl ?? undefined), {
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(`Failed to load price history with ${response.status}: ${text}`)
  }

  const result = (await response.json()) as PriceChangeSeries
  return result ?? {}
}
