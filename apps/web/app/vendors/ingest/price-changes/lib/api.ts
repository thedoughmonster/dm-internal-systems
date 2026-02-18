import type {
  PriceChangeRow,
  PriceChangeSeries,
  PriceChangeSeriesGranularity,
  PriceChangeSeriesResponse,
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

const DEFAULT_SERIES_DAYS = 90

function normalizeError(prefix: string, status: number, body: string) {
  const trimmed = body.trim()
  if (!trimmed) return `${prefix} with ${status}`
  try {
    const parsed = JSON.parse(trimmed) as { error?: unknown }
    if (typeof parsed?.error === "string" && parsed.error.trim().length > 0) {
      return `${prefix} with ${status}: ${parsed.error}`
    }
  } catch {
    // Ignore JSON parsing errors and fall back to raw body.
  }
  return `${prefix} with ${status}: ${trimmed}`
}

function getSeriesFunctionConfig() {
  const functionsBaseUrl = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL?.replace(/\/$/, "") ?? ""
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? ""
  const internalSecret = process.env.NEXT_PUBLIC_INTERNAL_UI_SHARED_SECRET ?? ""
  return { functionsBaseUrl, anonKey, internalSecret }
}

type FetchPriceChangeSeriesParams = {
  vendorId: string
  itemIds: string[]
  days?: number
  startDate?: string
  endDate?: string
  granularity?: PriceChangeSeriesGranularity
}

function normalizeSeriesResponse(
  payload: unknown,
  params: FetchPriceChangeSeriesParams,
  normalizedDays: number,
  granularity: PriceChangeSeriesGranularity
): PriceChangeSeriesResponse {
  if (!payload || typeof payload !== "object") {
    return {
      vendorId: params.vendorId,
      granularity,
      range: { startDate: "", endDate: "", days: normalizedDays, usedDefaultWindow: false },
      itemCount: 0,
      items: {},
    }
  }

  const maybeResponse = payload as Partial<PriceChangeSeriesResponse>
  if (maybeResponse.items && typeof maybeResponse.items === "object" && maybeResponse.range) {
    return maybeResponse as PriceChangeSeriesResponse
  }

  const legacy = payload as Record<string, Array<{ invoiceDate: string; averagePriceCents: number }>>
  const items: PriceChangeSeriesResponse["items"] = {}
  Object.entries(legacy).forEach(([itemId, points]) => {
    const safePoints = Array.isArray(points) ? points : []
    const sorted = safePoints
      .filter((point) => point && typeof point.invoiceDate === "string")
      .map((point) => ({
        invoiceDate: point.invoiceDate,
        averagePriceCents: toNumber(point.averagePriceCents),
        observationCount: 1,
        firstInvoiceDate: point.invoiceDate,
        lastInvoiceDate: point.invoiceDate,
      }))
      .sort((a, b) => a.invoiceDate.localeCompare(b.invoiceDate))
    items[itemId] = {
      observationCount: sorted.length,
      firstInvoiceDate: sorted[0]?.invoiceDate ?? null,
      lastInvoiceDate: sorted[sorted.length - 1]?.invoiceDate ?? null,
      points: sorted,
    }
  })

  return {
    vendorId: params.vendorId,
    granularity,
    range: {
      startDate: "",
      endDate: "",
      days: normalizedDays,
      usedDefaultWindow: !params.days && !params.startDate && !params.endDate,
    },
    itemCount: Object.keys(items).length,
    items,
  }
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
  params: FetchPriceChangeSeriesParams,
  baseUrl?: string | null
): Promise<PriceChangeSeries> {
  const responsePayload = await fetchPriceChangeSeriesResponse(params, baseUrl)
  const legacyShape: PriceChangeSeries = {}
  Object.entries(responsePayload.items).forEach(([itemId, item]) => {
    legacyShape[itemId] = item.points
  })
  return legacyShape
}

export async function fetchPriceChangeSeriesResponse(
  params: FetchPriceChangeSeriesParams,
  baseUrl?: string | null
): Promise<PriceChangeSeriesResponse> {
  if (params.itemIds.length === 0) {
    return {
      vendorId: params.vendorId,
      granularity: params.granularity ?? "day",
      range: {
        startDate: "",
        endDate: "",
        days: Math.max(1, params.days ?? DEFAULT_SERIES_DAYS),
        usedDefaultWindow: !params.days && !params.startDate && !params.endDate,
      },
      itemCount: 0,
      items: {},
    }
  }

  const normalizedDays = Math.max(1, params.days ?? DEFAULT_SERIES_DAYS)
  const normalizedGranularity = params.granularity ?? "day"
  const payload = {
    vendorId: params.vendorId,
    itemIds: params.itemIds,
    days: normalizedDays,
    granularity: normalizedGranularity,
    startDate: params.startDate,
    endDate: params.endDate,
  }
  const { functionsBaseUrl, anonKey, internalSecret } = getSeriesFunctionConfig()

  if (functionsBaseUrl && anonKey) {
    const headers: Record<string, string> = {
      authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
      "content-type": "application/json",
    }
    if (internalSecret) headers["x-internal-ui-secret"] = internalSecret
    const response = await fetch(`${functionsBaseUrl}/vendor_price_change_series_read_v1`, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
      cache: "no-store",
    })
    if (!response.ok) {
      const text = await response.text()
      throw new Error(normalizeError("Failed to load price history", response.status, text))
    }
    const result = await response.json()
    return normalizeSeriesResponse(result, params, normalizedDays, normalizedGranularity)
  }

  const query = new URLSearchParams({
    mode: "series",
    vendorId: payload.vendorId,
    days: normalizedDays.toString(),
    granularity: normalizedGranularity,
    itemIds: payload.itemIds.join(","),
  })
  if (payload.startDate) query.set("startDate", payload.startDate)
  if (payload.endDate) query.set("endDate", payload.endDate)

  const response = await fetch(buildApiUrl(`/api/price-changes?${query.toString()}`, baseUrl ?? undefined), {
    cache: "no-store",
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(normalizeError("Failed to load price history", response.status, text))
  }

  const result = await response.json()
  return normalizeSeriesResponse(result, params, normalizedDays, normalizedGranularity)
}
