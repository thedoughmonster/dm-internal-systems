import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

type SeriesPayload = {
  vendorId: string
  days?: number
  itemIds: string[]
  startDate?: string
  endDate?: string
  granularity?: "day" | "week" | "month"
}

type InvoiceLineRow = {
  vendor_catalog_item_id: string | null
  unit_price_cents: number | string | null
  vendor_invoices: {
    invoice_date: string
    vendor_id: string
  } | null
}

type PriceSeriesPoint = {
  invoiceDate: string
  averagePriceCents: number
  observationCount: number
  firstInvoiceDate: string
  lastInvoiceDate: string
}

type PriceSeriesItem = {
  observationCount: number
  firstInvoiceDate: string | null
  lastInvoiceDate: string | null
  points: PriceSeriesPoint[]
}

type PriceSeriesResponse = {
  vendorId: string
  granularity: "day" | "week" | "month"
  range: {
    startDate: string
    endDate: string
    days: number
    usedDefaultWindow: boolean
  }
  itemCount: number
  items: Record<string, PriceSeriesItem>
}

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-headers": "authorization, apikey, content-type, x-internal-ui-secret",
  "access-control-allow-methods": "POST, OPTIONS",
}

function toNumber(value: number | string | null, fallback = 0) {
  if (typeof value === "number") return value
  if (typeof value === "string" && value.trim().length > 0) {
    const parsed = Number(value)
    return Number.isNaN(parsed) ? fallback : parsed
  }
  return fallback
}

const MS_PER_DAY = 24 * 60 * 60 * 1000
const DEFAULT_DAYS = 90

function toIsoDate(value: Date) {
  return value.toISOString().slice(0, 10)
}

function parseIsoDate(value: unknown) {
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return null
  const date = new Date(`${value}T00:00:00.000Z`)
  return Number.isNaN(date.getTime()) ? null : date
}

function clampDays(value: unknown) {
  const days = toNumber(typeof value === "number" ? value : typeof value === "string" ? value : null, DEFAULT_DAYS)
  return Math.min(365, Math.max(1, Math.floor(days)))
}

function parseGranularity(value: unknown): "day" | "week" | "month" {
  if (value === "week" || value === "month") return value
  return "day"
}

function getWindow(payload: SeriesPayload) {
  const requestedDays = clampDays(payload.days)
  const now = new Date()
  const end = parseIsoDate(payload.endDate) ?? now
  const explicitStart = parseIsoDate(payload.startDate)
  const usedDefaultWindow = !payload.startDate && !payload.endDate && payload.days === undefined
  const start = explicitStart ?? new Date(end.getTime() - (requestedDays - 1) * MS_PER_DAY)
  const normalizedStart = start.getTime() <= end.getTime() ? start : new Date(end.getTime() - (requestedDays - 1) * MS_PER_DAY)
  const diffDays = Math.floor((end.getTime() - normalizedStart.getTime()) / MS_PER_DAY) + 1
  return {
    startDate: toIsoDate(normalizedStart),
    endDate: toIsoDate(end),
    days: Math.max(1, diffDays),
    usedDefaultWindow,
  }
}

function startOfWeek(date: Date) {
  const copy = new Date(date.getTime())
  const day = copy.getUTCDay()
  const offset = day === 0 ? -6 : 1 - day
  copy.setUTCDate(copy.getUTCDate() + offset)
  copy.setUTCHours(0, 0, 0, 0)
  return copy
}

function toBucketDate(invoiceDate: string, granularity: "day" | "week" | "month") {
  const parsed = parseIsoDate(invoiceDate)
  if (!parsed) return invoiceDate
  if (granularity === "week") return toIsoDate(startOfWeek(parsed))
  if (granularity === "month") return `${invoiceDate.slice(0, 7)}-01`
  return invoiceDate
}

serve(async (request) => {
  if (request.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders })
  }

  if (request.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: {
        ...corsHeaders,
        "content-type": "application/json",
      },
    })
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")

    if (!supabaseUrl || !serviceRoleKey) {
      return new Response(JSON.stringify({ error: "Missing Supabase env" }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
        },
      })
    }

    const payload = (await request.json()) as SeriesPayload

    if (!payload?.vendorId) {
      return new Response(JSON.stringify({ error: "Missing vendorId" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
        },
      })
    }

    if (!Array.isArray(payload.itemIds) || payload.itemIds.length === 0) {
      return new Response(JSON.stringify({ error: "Missing itemIds" }), {
        status: 400,
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
        },
      })
    }

    const granularity = parseGranularity(payload.granularity)
    const range = getWindow(payload)

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const { data, error } = await supabase
      .from("vendor_invoice_lines")
      .select("vendor_catalog_item_id,unit_price_cents,vendor_invoices!inner(invoice_date,vendor_id)")
      .eq("vendor_invoices.vendor_id", payload.vendorId)
      .gte("vendor_invoices.invoice_date", range.startDate)
      .lte("vendor_invoices.invoice_date", range.endDate)
      .in("vendor_catalog_item_id", payload.itemIds)
      .order("invoice_date", { foreignTable: "vendor_invoices", ascending: true })

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
        },
      })
    }

    const rows = (data ?? []) as InvoiceLineRow[]
    const seriesMap = new Map<string, Map<string, { total: number; count: number; first: string; last: string }>>()
    const itemMeta = new Map<string, { count: number; first: string | null; last: string | null }>()

    rows.forEach((row) => {
      if (!row.vendor_catalog_item_id) return
      const invoiceDate = row.vendor_invoices?.invoice_date
      if (!invoiceDate) return
      const unitPrice = toNumber(row.unit_price_cents, Number.NaN)
      if (Number.isNaN(unitPrice)) return

      const itemMap = seriesMap.get(row.vendor_catalog_item_id) ?? new Map()
      const bucketDate = toBucketDate(invoiceDate, granularity)
      const current = itemMap.get(bucketDate) ?? {
        total: 0,
        count: 0,
        first: invoiceDate,
        last: invoiceDate,
      }
      itemMap.set(bucketDate, {
        total: current.total + unitPrice,
        count: current.count + 1,
        first: current.first < invoiceDate ? current.first : invoiceDate,
        last: current.last > invoiceDate ? current.last : invoiceDate,
      })
      if (!seriesMap.has(row.vendor_catalog_item_id)) {
        seriesMap.set(row.vendor_catalog_item_id, itemMap)
      }

      const meta = itemMeta.get(row.vendor_catalog_item_id) ?? { count: 0, first: null, last: null }
      meta.count += 1
      meta.first = !meta.first || invoiceDate < meta.first ? invoiceDate : meta.first
      meta.last = !meta.last || invoiceDate > meta.last ? invoiceDate : meta.last
      itemMeta.set(row.vendor_catalog_item_id, meta)
    })

    const items: Record<string, PriceSeriesItem> = {}
    seriesMap.forEach((dateMap, itemId) => {
      const points = Array.from(dateMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([invoiceDate, summary]): PriceSeriesPoint => ({
          invoiceDate,
          averagePriceCents: Math.round(summary.total / summary.count),
          observationCount: summary.count,
          firstInvoiceDate: summary.first,
          lastInvoiceDate: summary.last,
        }))
      const meta = itemMeta.get(itemId) ?? { count: 0, first: null, last: null }
      items[itemId] = {
        observationCount: meta.count,
        firstInvoiceDate: meta.first,
        lastInvoiceDate: meta.last,
        points,
      }
    })

    const response: PriceSeriesResponse = {
      vendorId: payload.vendorId,
      granularity,
      range,
      itemCount: Object.keys(items).length,
      items,
    }

    return new Response(JSON.stringify(response), {
      status: 200,
      headers: {
        ...corsHeaders,
        "content-type": "application/json",
      },
    })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown error"
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: {
        ...corsHeaders,
        "content-type": "application/json",
      },
    })
  }
})
