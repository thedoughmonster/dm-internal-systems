import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type QueueRequest = {
  limit?: number;
};

type QueueRow = {
  vendor_id: string;
  vendor_key: string;
  pack_string_normalized: string;
  line_count: number;
  raw_samples: string[];
  vendor_invoice_id: string;
  vendor_invoice_number: string;
  invoice_date: string;
  vendor_sku: string | null;
  description: string | null;
  pack_string_raw: string;
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

async function parseJsonBody(req: Request): Promise<QueueRequest> {
  const text = await req.text();
  if (!text.trim()) return {};
  try {
    return JSON.parse(text) as QueueRequest;
  } catch {
    throw new Error("INVALID_JSON");
  }
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

  let payload: QueueRequest = {};
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

  const limit =
    typeof payload.limit === "number" && Number.isFinite(payload.limit)
      ? Math.trunc(payload.limit)
      : undefined;

  try {
    const supabase = createClient(env("SUPABASE_URL"), env("SUPABASE_SERVICE_ROLE_KEY"));
    const { data, error } = await supabase.rpc(
      "vendor_pack_unmapped_queue_v1",
      limit ? { p_limit: limit } : {},
    );

    if (error) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "QUEUE_FAILED",
            message: "Failed to load pack mapping queue",
            details: { reason: error.message },
          },
        },
        500,
        corsHeaders,
      );
    }

    return jsonResponse(
      {
        ok: true,
        rows: (data ?? []) as QueueRow[],
      },
      200,
      corsHeaders,
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "UNHANDLED_ERROR";
    return jsonResponse(
      { ok: false, error: { code: "UNHANDLED_ERROR", message } },
      500,
      corsHeaders,
    );
  }
});
