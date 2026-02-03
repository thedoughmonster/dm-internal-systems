import type { NextApiRequest, NextApiResponse } from "next";

function requiredEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name}`);
  }
  return value;
}

function normalizeBody(body: unknown) {
  if (body == null) {
    return {};
  }

  if (typeof body === "string") {
    if (!body.trim().length) {
      return {};
    }
    try {
      return JSON.parse(body) as unknown;
    } catch {
      return {};
    }
  }

  return body;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    res.setHeader("Allow", "POST");
    res.status(405).json({ ok: false, error: { message: "Method not allowed" } });
    return;
  }

  try {
    const baseUrl = requiredEnv("NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL").replace(/\/$/, "");
    const anonKey = requiredEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY");
    const internalSecret = process.env.NEXT_PUBLIC_INTERNAL_UI_SHARED_SECRET;

    const headers: Record<string, string> = {
      Authorization: `Bearer ${anonKey}`,
      apikey: anonKey,
      "content-type": "application/json",
    };

    if (internalSecret) {
      headers["x-internal-ui-secret"] = internalSecret;
    }

    const upstream = await fetch(`${baseUrl}/vendor_pack_parse_upsert_v1`, {
      method: "POST",
      headers,
      body: JSON.stringify(normalizeBody(req.body)),
    });

    const contentType = upstream.headers.get("content-type") ?? "application/json";
    const upstreamBody = await upstream.text();

    res.setHeader("content-type", contentType);
    res.status(upstream.status).send(upstreamBody);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upstream request failed.";
    res.status(500).json({ ok: false, error: { message } });
  }
}

