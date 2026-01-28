import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { extractSignature } from "../vendor_ingest/signature_extractors.ts";
import { sysco_purchase_history_v1 } from "../vendor_ingest/identifier_functions/sysco_purchase_history_v1.ts";
import { ingestSyscoPurchaseHistoryV1 } from "../vendor_ingest/ingestion_handlers/sysco_purchase_history_v1.ts";

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
    "access-control-allow-headers": "content-type, authorization, apikey, x-client-info",
    vary: "Origin",
  };
};

serve(async (req) => {
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
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

  const rawBody = await req.text();
  const contentType = req.headers.get("content-type") ?? "";

  let csvText: string | null = null;
  if (contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(rawBody) as unknown;
      if (parsed && typeof parsed === "object" && "csv" in parsed) {
        const candidate = (parsed as { csv?: unknown }).csv;
        if (typeof candidate === "string") {
          csvText = candidate;
        }
      }
    } catch {}
  } else {
    csvText = rawBody;
  }

  if (!csvText || !csvText.trim()) {
    return new Response(
      JSON.stringify({
        error: "INVALID_REQUEST_BODY",
        message: "Expected JSON { csv: string } or raw CSV text body",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
        },
      },
    );
  }

  const extractedSignature = extractSignature(csvText);
  const identifier = await sysco_purchase_history_v1({
    csvText,
    extracted: extractedSignature,
  });

  if (identifier.status !== "MATCH") {
    const signatureSummary = {
      fileKind: extractedSignature.fileKind,
      recordTypesPresent: extractedSignature.recordTypesPresent,
      fFieldCount: extractedSignature.fFields ? extractedSignature.fFields.length : null,
    };
    return new Response(
      JSON.stringify({
        error: "IDENTIFICATION_FAILED",
        identifier,
        signatureSummary,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "content-type": "application/json",
        },
      },
    );
  }

  const supabaseClient = createClient(
    env("SUPABASE_URL"),
    env("SUPABASE_SERVICE_ROLE_KEY"),
  );

  const result = await ingestSyscoPurchaseHistoryV1({
    csvText,
    extractedSignature,
    supabaseClient,
  });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      ...corsHeaders,
      "content-type": "application/json",
    },
  });
});
