import type { NextApiRequest, NextApiResponse } from "next"

function requiredEnv(name: string) {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing ${name}`)
  }
  return value
}

function normalizeBody(body: unknown) {
  if (body == null) {
    return {}
  }

  if (typeof body === "string") {
    if (!body.trim().length) {
      return {}
    }
    try {
      return JSON.parse(body) as unknown
    } catch {
      return {}
    }
  }

  return body
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
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

    if (req.method === "GET") {
      const key = Array.isArray(req.query.key) ? req.query.key[0] : req.query.key
      if (!key || typeof key !== "string") {
        res.status(400).json({ error: "Missing key" })
        return
      }

      const upstream = await fetch(
        `${baseUrl}/app_settings_read_v1?key=${encodeURIComponent(key)}`,
        {
          method: "GET",
          headers,
        }
      )

      const contentType = upstream.headers.get("content-type") ?? "application/json"
      const upstreamBody = await upstream.text()

      res.setHeader("content-type", contentType)
      res.status(upstream.status).send(upstreamBody)
      return
    }

    if (req.method === "POST") {
      const upstream = await fetch(`${baseUrl}/app_settings_upsert_v1`, {
        method: "POST",
        headers,
        body: JSON.stringify(normalizeBody(req.body)),
      })

      const contentType = upstream.headers.get("content-type") ?? "application/json"
      const upstreamBody = await upstream.text()

      res.setHeader("content-type", contentType)
      res.status(upstream.status).send(upstreamBody)
      return
    }

    res.setHeader("Allow", "GET, POST")
    res.status(405).json({ error: "Method not allowed" })
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upstream request failed."
    res.status(500).json({ error: message })
  }
}
