import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

type ApplyMode = "REPLACE_ALWAYS" | "ONLY_IF_NULL";

type PackApplyRequest = {
  vendorId: string;
  catalogItemId: string;
  packStringRaw: string;
  packStringNormalized: string;
  applyMode: ApplyMode;
  notes: string;
  evidence?: Record<string, unknown> | null;
};

type PackParseRow = {
  id: string;
  vendor_id: string;
  pack_string_normalized: string;
  pack_qty: number;
  pack_uom: string;
  pack_size: number;
  pack_size_uom: string;
  verified_at: string;
  verified_by: string | null;
  evidence: Record<string, unknown> | null;
};

type CatalogItemRow = {
  id: string;
  vendor_id: string;
  pack_qty: number | null;
  pack_uom: string | null;
  pack_size: number | null;
  pack_size_uom: string | null;
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

async function parseJsonBody(req: Request): Promise<PackApplyRequest> {
  const text = await req.text();
  if (!text.trim()) {
    throw new Error("EMPTY_BODY");
  }
  try {
    return JSON.parse(text) as PackApplyRequest;
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

function requireMode(value: unknown): ApplyMode {
  if (value === "REPLACE_ALWAYS" || value === "ONLY_IF_NULL") {
    return value;
  }
  throw new Error("INVALID_APPLY_MODE");
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

  let payload: PackApplyRequest;
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
    const catalogItemId = requireString(payload.catalogItemId, "catalog_item_id");
    const packStringRaw = requireString(payload.packStringRaw, "pack_string_raw");
    const packStringNormalized = requireString(
      payload.packStringNormalized,
      "pack_string_normalized",
    );
    const notes = requireString(payload.notes, "notes").trim();
    const applyMode = requireMode(payload.applyMode);

    const normalized = normalizePackString(packStringRaw);
    if (normalized !== packStringNormalized) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "NORMALIZED_MISMATCH",
            message: "Normalized pack string does not match raw pack string",
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

    const { data: parse, error: parseError } = await supabase
      .from("vendor_pack_string_parses")
      .select(
        "id, vendor_id, pack_string_normalized, pack_qty, pack_uom, pack_size, pack_size_uom, verified_at, verified_by, evidence",
      )
      .eq("vendor_id", vendorId)
      .eq("pack_string_normalized", packStringNormalized)
      .maybeSingle();

    if (parseError) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "PARSE_LOOKUP_FAILED",
            message: "Failed to load pack string parse",
            details: { reason: parseError.message },
          },
        },
        500,
        corsHeaders,
      );
    }

    if (!parse) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "PARSE_NOT_FOUND",
            message: "Pack string parse not found",
          },
        },
        404,
        corsHeaders,
      );
    }

    const { data: catalogItem, error: catalogError } = await supabase
      .from("vendor_catalog_items")
      .select("id, vendor_id, pack_qty, pack_uom, pack_size, pack_size_uom")
      .eq("id", catalogItemId)
      .maybeSingle();

    if (catalogError) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "CATALOG_LOOKUP_FAILED",
            message: "Failed to load vendor catalog item",
            details: { reason: catalogError.message },
          },
        },
        500,
        corsHeaders,
      );
    }

    if (!catalogItem) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "CATALOG_ITEM_NOT_FOUND",
            message: "Vendor catalog item not found",
          },
        },
        404,
        corsHeaders,
      );
    }

    if (catalogItem.vendor_id !== vendorId) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "VENDOR_MISMATCH",
            message: "Catalog item vendor does not match parse vendor",
          },
        },
        409,
        corsHeaders,
      );
    }

    const parsed = parse as PackParseRow;
    const current = catalogItem as CatalogItemRow;

    const nextValues = {
      pack_qty:
        applyMode === "ONLY_IF_NULL" && current.pack_qty !== null
          ? current.pack_qty
          : parsed.pack_qty,
      pack_uom:
        applyMode === "ONLY_IF_NULL" && current.pack_uom !== null
          ? current.pack_uom
          : parsed.pack_uom,
      pack_size:
        applyMode === "ONLY_IF_NULL" && current.pack_size !== null
          ? current.pack_size
          : parsed.pack_size,
      pack_size_uom:
        applyMode === "ONLY_IF_NULL" && current.pack_size_uom !== null
          ? current.pack_size_uom
          : parsed.pack_size_uom,
    };

    const { data: updated, error: updateError } = await supabase
      .from("vendor_catalog_items")
      .update(nextValues)
      .eq("id", catalogItemId)
      .select("id, vendor_id, pack_qty, pack_uom, pack_size, pack_size_uom")
      .single();

    if (updateError || !updated) {
      return jsonResponse(
        {
          ok: false,
          error: {
            code: "UPDATE_FAILED",
            message: "Failed to update vendor catalog item",
            details: { reason: updateError?.message ?? "unknown" },
          },
        },
        500,
        corsHeaders,
      );
    }

    const evidencePayload = {
      ...(payload.evidence ?? {}),
      notes,
      applyMode,
      packStringRaw,
      packStringNormalized,
      catalogItemId,
    };

    return jsonResponse(
      {
        ok: true,
        catalogItem: updated,
        parse: parsed,
        metadata: {
          evidence: evidencePayload,
        },
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
