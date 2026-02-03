import { serve } from "https://deno.land/std@0.208.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

type SeriesPayload = {
  vendorId: string
  days: number
  itemIds: string[]
}

type InvoiceLineRow = {
  vendor_catalog_item_id: string | null
  unit_price_cents: number | string | null
  vendor_invoices: {
    invoice_date: string
    vendor_id: string
  } | null
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

    const startDate = new Date()
    startDate.setDate(startDate.getDate() - (payload.days ?? 28))
    const startDateString = startDate.toISOString().slice(0, 10)

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: { persistSession: false },
    })

    const { data, error } = await supabase
      .from("vendor_invoice_lines")
      .select("vendor_catalog_item_id,unit_price_cents,vendor_invoices!inner(invoice_date,vendor_id)")
      .eq("vendor_invoices.vendor_id", payload.vendorId)
      .gte("vendor_invoices.invoice_date", startDateString)
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
    const seriesMap = new Map<string, Map<string, { total: number; count: number }>>()

    rows.forEach((row) => {
      if (!row.vendor_catalog_item_id) return
      const invoiceDate = row.vendor_invoices?.invoice_date
      if (!invoiceDate) return
      const unitPrice = toNumber(row.unit_price_cents, Number.NaN)
      if (Number.isNaN(unitPrice)) return

      const itemMap = seriesMap.get(row.vendor_catalog_item_id) ?? new Map()
      const current = itemMap.get(invoiceDate) ?? { total: 0, count: 0 }
      itemMap.set(invoiceDate, {
        total: current.total + unitPrice,
        count: current.count + 1,
      })
      if (!seriesMap.has(row.vendor_catalog_item_id)) {
        seriesMap.set(row.vendor_catalog_item_id, itemMap)
      }
    })

    const result: Record<string, Array<{ invoiceDate: string; averagePriceCents: number }>> = {}
    seriesMap.forEach((dateMap, itemId) => {
      const points = Array.from(dateMap.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([invoiceDate, summary]) => ({
          invoiceDate,
          averagePriceCents: Math.round(summary.total / summary.count),
        }))
      result[itemId] = points
    })

    return new Response(JSON.stringify(result), {
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
