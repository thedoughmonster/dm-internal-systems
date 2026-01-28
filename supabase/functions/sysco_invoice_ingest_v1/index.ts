import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { runIdentification } from "../vendor_ingest/identify.ts";
import { ingestSyscoInvoiceV1 } from "../vendor_ingest/ingestion_handlers/sysco_invoice_v1.ts";

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

function buildSignatureSummary(extracted: {
  fileKind: string;
  recordTypesPresent: string[];
  fFields: string[] | null;
}) {
  return {
    fileKind: extracted.fileKind,
    recordTypesPresent: extracted.recordTypesPresent,
    fFieldCount: extracted.fFields ? extracted.fFields.length : null,
  };
}

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

  const bodyText = await req.text();
  const contentType = req.headers.get("content-type") ?? "";

  let csvText: string | null = null;
  if (contentType.includes("application/json")) {
    try {
      const parsed = JSON.parse(bodyText) as unknown;
      if (parsed && typeof parsed === "object" && "csv" in parsed) {
        const candidate = (parsed as { csv?: unknown }).csv;
        if (typeof candidate === "string") {
          csvText = candidate;
        }
      }
    } catch {}
  } else {
    csvText = bodyText;
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

  const identification = await runIdentification({ csvText });
  const expectedId = identification.proposed?.id === "sysco_invoice_v1";
  if (identification.status !== "PROPOSED_MATCH" || !expectedId) {
    return new Response(
      JSON.stringify({
        message: "INCOMPATIBLE_OR_UNKNOWN_FORMAT",
        status: identification.status,
        proposed: identification.proposed,
        ambiguity: identification.ambiguity,
        best: identification.best,
        signatureSummary: buildSignatureSummary(identification.extracted),
        sampleLines: identification.extracted.sampleLines.slice(0, 5),
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

  const result = await ingestSyscoInvoiceV1({
    supabase: supabaseClient,
    vendorKey: "sysco",
    csvText,
    extracted: identification.extracted,
  });

  return new Response(JSON.stringify(result), {
    status: 200,
    headers: {
      ...corsHeaders,
      "content-type": "application/json",
    },
  });
});
