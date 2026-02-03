import type { NextApiRequest, NextApiResponse } from "next"

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}`)
  }
  return value
}

function parseNumber(value: string | string[] | undefined, fallback: number) {
  const raw = Array.isArray(value) ? value[0] : value
  if (!raw) return fallback
  const parsed = Number(raw)
  return Number.isNaN(parsed) ? fallback : parsed
}

function parseString(value: string | string[] | undefined) {
  const raw = Array.isArray(value) ? value[0] : value
  return raw ?? null
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET")
    res.status(405).json({ error: "Method not allowed" })
    return
  }

  try {
    const baseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL").replace(/\/$/, "")
    const anonKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    const internalSecret = process.env.NEXT_PUBLIC_INTERNAL_UI_SHARED_SECRET

    const headers: Record<string, string> = {
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
      "content-type": "application/json",
    }

    if (internalSecret) {
      headers["x-internal-ui-secret"] = internalSecret
    }

    const mode = parseString(req.query.mode) ?? "list"

    if (mode === "series") {
      const vendorId = parseString(req.query.vendorId)
      const itemIdsRaw = parseString(req.query.itemIds)
      const days = parseNumber(req.query.days, 28)

      if (!vendorId || !itemIdsRaw) {
        res.status(400).json({ error: "Missing vendorId or itemIds" })
        return
      }

      const itemIds = itemIdsRaw.split(",").map((item) => item.trim()).filter(Boolean)
      if (itemIds.length === 0) {
        res.status(400).json({ error: "Missing itemIds" })
        return
      }

      const upstream = await fetch(`${baseUrl}/vendor_price_change_series_read_v1`, {
        method: "POST",
        headers,
        body: JSON.stringify({ vendorId, days, itemIds }),
      })

      const contentType = upstream.headers.get("content-type") ?? "application/json"
      const upstreamBody = await upstream.text()

      res.setHeader("content-type", contentType)
      res.status(upstream.status).send(upstreamBody)
      return
    }

    if (mode === "default-vendor") {
      const upstream = await fetch(`${baseUrl}/vendor_price_changes_read_v1`, {
        method: "POST",
        headers,
        body: JSON.stringify({ mode: "default_vendor" }),
      })

      const contentType = upstream.headers.get("content-type") ?? "application/json"
      const upstreamBody = await upstream.text()

      res.setHeader("content-type", contentType)
      res.status(upstream.status).send(upstreamBody)
      return
    }

    const vendorId = parseString(req.query.vendorId)
    if (!vendorId) {
      res.status(400).json({ error: "Missing vendorId" })
      return
    }

    const days = parseNumber(req.query.days, 28)
    const minPercentChange = parseNumber(req.query.minPercentChange, 0.02)

    const upstream = await fetch(`${baseUrl}/vendor_price_changes_read_v1`, {
      method: "POST",
      headers,
      body: JSON.stringify({ vendorId, days, minPercentChange }),
    })

    const contentType = upstream.headers.get("content-type") ?? "application/json"
    const upstreamBody = await upstream.text()

    res.setHeader("content-type", contentType)
    res.status(upstream.status).send(upstreamBody)
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upstream request failed."
    res.status(500).json({ error: message })
  }
}
