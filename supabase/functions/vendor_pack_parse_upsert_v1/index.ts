import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type PackParseUpsertRequest = {
  vendorId: string;
  packStringRaw: string;
  packStringStructured: string;
  packQty: number;
  packUom: string;
  packSize: number;
  packSizeUom: string;
  verifiedBy?: string | null;
  notes?: string | null;
  evidence?: Record<string, unknown> | null;
};

type PackParseRow = {
  id: string;
  vendor_id: string;
  pack_string_raw: string;
  pack_string_normalized: string;
  pack_qty: number;
  pack_uom: string;
  pack_size: number;
  pack_size_uom: string;
  verified_at: string;
  verified_by: string | null;
  evidence: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
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
    "access-control-allow-headers": "content-type, authorization, apikey, x-client-info, x-internal-ui-secret",
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

async function parseJsonBody(req: Request): Promise<PackParseUpsertRequest> {
  const text = await req.text();
  if (!text.trim()) {
    throw new Error("EMPTY_BODY");
  }
  try {
    return JSON.parse(text) as PackParseUpsertRequest;
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

function requireNumber(value: unknown, field: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
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

  let payload: PackParseUpsertRequest;
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
    const packStringStructured = requireString(
      payload.packStringStructured,
      "pack_string_structured",
    );
    const packQty = requireNumber(payload.packQty, "pack_qty");
    const packUom = requireString(payload.packUom, "pack_uom");
    const packSize = requireNumber(payload.packSize, "pack_size");
    const packSizeUom = requireString(payload.packSizeUom, "pack_size_uom");

    const normalized = normalizePackString(packStringRaw);
    if (packStringStructured !== normalized) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "STRUCTURED_TEXT_MISMATCH",
            message: "Structured text must equal normalized pack string",
            details: { normalized },
          },
        },
        409,
        corsHeaders,
      );
    }

    const supabase = createClient(
      env("SUPABASE_URL"),
      env("SUPABASE_SERVICE_ROLE_KEY"),
    );

    const { data: existing, error: existingError } = await supabase
      .from("vendor_pack_string_parses")
      .select("id")
      .eq("vendor_id", vendorId)
      .eq("pack_string_normalized", normalized)
      .maybeSingle();

    if (existingError) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "LOOKUP_FAILED",
            message: "Failed to check existing parse",
            details: { reason: existingError.message },
          },
        },
        500,
        corsHeaders,
      );
    }

    const notes = payload.notes?.trim() ?? "";
    if (existing && !notes) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "NOTES_REQUIRED",
            message: "Notes are required when updating a parse",
          },
        },
        400,
        corsHeaders,
      );
    }

    const evidencePayload = {
      ...(payload.evidence ?? {}),
      ...(notes ? { notes } : {}),
    };

    const { data, error } = await supabase
      .from("vendor_pack_string_parses")
      .upsert(
        {
          vendor_id: vendorId,
          pack_string_raw: packStringRaw,
          pack_string_normalized: normalized,
          pack_qty: packQty,
          pack_uom: packUom,
          pack_size: packSize,
          pack_size_uom: packSizeUom,
          verified_at: new Date().toISOString(),
          verified_by: payload.verifiedBy ?? null,
          evidence: evidencePayload,
        },
        { onConflict: "vendor_id,pack_string_normalized" },
      )
      .select("*")
      .single();

    if (error || !data) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "UPSERT_FAILED",
            message: "Failed to upsert pack string parse",
            details: { reason: error?.message ?? "unknown" },
          },
        },
        500,
        corsHeaders,
      );
    }

    const parse = data as PackParseRow;

    return jsonResponse(
      {
        ok: true,
        parse,
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
