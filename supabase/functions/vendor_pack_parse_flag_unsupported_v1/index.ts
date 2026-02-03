import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type FlagUnsupportedRequest = {
  vendorId: string;
  packStringRaw: string;
};

const allowedOrigins = new Set([
  "http://localhost:3000",
  "https://doh.monster",
  "https://www.doh.monster",
]);

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  const isAllowed = allowedOrigins.has(origin);
  return {
    ...(isAllowed ? { "access-control-allow-origin": origin } : {}),
    "access-control-allow-methods": "POST,OPTIONS",
    "access-control-allow-headers":
      "content-type, authorization, apikey, x-client-info, x-internal-ui-secret",
    vary: "Origin",
  };
};

function jsonResponse(body: object, status: number, corsHeaders: Record<string, string>) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json",
    },
  });
}

async function parseJsonBody(req: Request): Promise<FlagUnsupportedRequest> {
  const text = await req.text();
  if (!text.trim()) {
    throw new Error("EMPTY_BODY");
  }
  try {
    return JSON.parse(text) as FlagUnsupportedRequest;
  } catch {
    throw new Error("INVALID_JSON");
  }
}

function normalizePackString(input: string): string {
  const trimmed = input.trim();
  let out = "";
  let lastWasSpace = false;
  for (const ch of trimmed) {
    const isSpace = ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
    if (isSpace) {
      if (!lastWasSpace) {
        out += " ";
        lastWasSpace = true;
      }
      continue;
    }
    out += ch.toUpperCase();
    lastWasSpace = false;
  }
  return out;
}

function requireString(value: unknown, field: string): string {
  if (typeof value !== "string" || !value.trim()) {
    throw new Error(`INVALID_${field.toUpperCase()}`);
  }
  return value;
}

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: {
        ...corsHeaders,
        "content-type": "text/plain; charset=utf-8",
      },
    });
  }

  let payload: FlagUnsupportedRequest;
  try {
    payload = await parseJsonBody(req);
  } catch (error) {
    const message = error instanceof Error ? error.message : "INVALID_REQUEST";
    return jsonResponse(
      { ok: false, error: { code: "INVALID_REQUEST", message } },
      400,
      corsHeaders,
    );
  }

  try {
    const vendorId = requireString(payload.vendorId, "vendor_id");
    const packStringRaw = requireString(payload.packStringRaw, "pack_string_raw");
    const normalized = normalizePackString(packStringRaw);

    const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));

    const { error } = await supabase.from("vendor_pack_string_parse_flags").upsert(
      {
        vendor_id: vendorId,
        pack_string_normalized: normalized,
        flag_type: "UNSUPPORTED_FORMAT",
      },
      { onConflict: "vendor_id,pack_string_normalized" },
    );

    if (error) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "UPSERT_FAILED",
            message: "Failed to flag pack string",
            details: { reason: error.message },
          },
        },
        500,
        corsHeaders,
      );
    }

    return jsonResponse({ ok: true }, 200, corsHeaders);
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNKNOWN_ERROR";
    return jsonResponse(
      { ok: false, error: { code: "FLAG_FAILED", message } },
      400,
      corsHeaders,
    );
  }
});

