import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { runIdentification } from "./identify.ts";
import { dispatchToHandler } from "./dispatch.ts";
import { readCsvAndMeta } from "./request_parsing.ts";
import { buildAuditEvent } from "./audit.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import {
  IngestConfirmBlockedResponse,
  IngestConfirmSuccessResponse,
  IngestSniffResponse,
  PackIntent,
  ProposedMatch,
} from "./ingest_types.ts";
import { IdentifyResult } from "./identifier_types.ts";

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

function jsonResponse(
  body: object,
  status: number,
  corsHeaders: Record<string, string>,
): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "content-type": "application/json",
    },
  });
}

function buildErrorResponse(
  code: IngestConfirmBlockedResponse["error"]["code"],
  message: string,
  details: object | null,
): IngestConfirmBlockedResponse {
  return {
    ok: false,
    mode: "CONFIRM",
    error: {
      code,
      message,
      ...(details ? { details } : {}),
    },
  };
}

function buildMismatchDetails(expected: {
  expectedId: string | null;
  expectedVendorKey: string | null;
  expectedDocumentType: string | null;
  expectedFormatVersion: number | null;
}): object {
  return {
    expectedId: expected.expectedId,
    expectedVendorKey: expected.expectedVendorKey,
    expectedDocumentType: expected.expectedDocumentType,
    expectedFormatVersion: expected.expectedFormatVersion,
  };
}

function summarizeIncompatible(results: IdentifyResult[]): object[] {
  return results
    .filter((result) => result.status === "INCOMPATIBLE")
    .map((result) => ({
      id: result.id,
      vendorKey: result.vendorKey,
      documentType: result.documentType,
      formatVersion: result.formatVersion,
      reasons: result.reasons,
      warnings: result.warnings,
    }));
}

function buildUnexpectedErrorPayload(error: unknown): object {
  if (error instanceof Error) {
    const stack = error.stack ?? "";
    const stackLines = stack ? stack.split("\n").slice(0, 3) : [];
    return {
      message: error.message,
      stackSnippet: stackLines,
    };
  }
  return { message: "Unknown error" };
}

function normalizePackString(value: string): string {
  return value.trim().replace(/\s+/g, " ").toUpperCase();
}

function buildEmptyPackIntent(
  applicable: boolean,
  vendorInvoiceId: string | null,
): PackIntent {
  return {
    applicable,
    vendorInvoiceId,
    unmappedPackLineCount: 0,
    unmappedPackGroupCount: 0,
    unmappedPackGroups: [],
  };
}

async function buildPackIntent(params: {
  supabase: ReturnType<typeof createClient>;
  vendorId: string;
  invoiceId: string | null;
}): Promise<PackIntent> {
  const { supabase, vendorId, invoiceId } = params;
  if (!invoiceId) {
    return buildEmptyPackIntent(false, null);
  }

  const { data: invoiceLines, error: invoiceLinesError } = await supabase
    .from("vendor_invoice_lines")
    .select("vendor_sku, description, raw")
    .eq("vendor_invoice_id", invoiceId);
  if (invoiceLinesError) {
    throw invoiceLinesError;
  }

  const grouped = new Map<
    string,
    {
      lineCount: number;
      rawSamples: Set<string>;
      sampleLine: { vendorSku: string | null; description: string | null };
    }
  >();

  for (const line of invoiceLines ?? []) {
    const raw = line?.raw as { pack_size_text?: unknown } | null;
    const rawPack = typeof raw?.pack_size_text === "string" ? raw.pack_size_text : null;
    if (!rawPack) continue;
    const normalized = normalizePackString(rawPack);
    if (!normalized) continue;

    const entry =
      grouped.get(normalized) ?? {
        lineCount: 0,
        rawSamples: new Set<string>(),
        sampleLine: { vendorSku: null, description: null },
      };

    entry.lineCount += 1;
    if (entry.rawSamples.size < 3 && !entry.rawSamples.has(rawPack)) {
      entry.rawSamples.add(rawPack);
    }
    if (!entry.sampleLine.vendorSku && line?.vendor_sku) {
      entry.sampleLine.vendorSku = line.vendor_sku;
    }
    if (!entry.sampleLine.description && line?.description) {
      entry.sampleLine.description = line.description;
    }

    grouped.set(normalized, entry);
  }

  const normalizedStrings = Array.from(grouped.keys());
  if (normalizedStrings.length === 0) {
    return buildEmptyPackIntent(true, invoiceId);
  }

  const { data: parsedRows, error: parseError } = await supabase
    .from("vendor_pack_string_parses")
    .select("pack_string_normalized")
    .eq("vendor_id", vendorId)
    .in("pack_string_normalized", normalizedStrings);
  if (parseError) {
    throw parseError;
  }

  const mapped = new Set(
    (parsedRows ?? [])
      .map((row) => row.pack_string_normalized)
      .filter((value): value is string => Boolean(value)),
  );

  const unmapped = normalizedStrings
    .map((packStringNormalized) => {
      const entry = grouped.get(packStringNormalized);
      if (!entry) return null;
      return {
        packStringNormalized,
        lineCount: entry.lineCount,
        rawSamples: Array.from(entry.rawSamples),
        sampleLine: entry.sampleLine,
      };
    })
    .filter(
      (entry): entry is NonNullable<typeof entry> =>
        Boolean(entry && !mapped.has(entry.packStringNormalized)),
    )
    .sort((a, b) => b.lineCount - a.lineCount)
    .slice(0, 25);

  const unmappedLineCount = unmapped.reduce((sum, entry) => sum + entry.lineCount, 0);

  return {
    applicable: true,
    vendorInvoiceId: invoiceId,
    unmappedPackLineCount: unmappedLineCount,
    unmappedPackGroupCount: unmapped.length,
    unmappedPackGroups: unmapped,
  };
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

  let csvText = "";
  let filename: string | null = null;
  let confirm = false;
  let expectedId: string | null = null;
  let expectedVendorKey: string | null = null;
  let expectedDocumentType: string | null = null;
  let expectedFormatVersion: number | null = null;
  let dryRun = false;

  try {
    const parsed = await readCsvAndMeta(req);
    csvText = parsed.csvText;
    filename = parsed.filename;
    confirm = parsed.meta.confirm;
    expectedId = parsed.meta.expectedId;
    expectedVendorKey = parsed.meta.expectedVendorKey;
    expectedDocumentType = parsed.meta.expectedDocumentType;
    expectedFormatVersion = parsed.meta.expectedFormatVersion;
    dryRun = parsed.meta.dryRun;
  } catch (error) {
    if (error instanceof Error && error.message === "MISSING_CSV") {
      const body = buildErrorResponse(
        "CONFIRMATION_REQUIRED",
        "CSV text is required",
        null,
      );
      return jsonResponse(body, 400, corsHeaders);
    }
    if (error instanceof Error && error.message === "INVALID_JSON") {
      const body = buildErrorResponse(
        "CONFIRMATION_REQUIRED",
        "Invalid JSON body",
        null,
      );
      return jsonResponse(body, 400, corsHeaders);
    }
    const body = buildErrorResponse(
      "CONFIRMATION_REQUIRED",
      "Unable to parse request body",
      buildUnexpectedErrorPayload(error),
    );
    return jsonResponse(body, 500, corsHeaders);
  }

  const identification = await runIdentification({ csvText, filename });

  const sniffResponse: IngestSniffResponse = {
    ok: true,
    mode: "SNIFF_ONLY",
    extracted: identification.extracted,
    status: identification.status,
    proposed: identification.proposed,
    ambiguity: identification.ambiguity,
    results: identification.results,
  };

  if (!confirm) {
    return jsonResponse(sniffResponse, 200, corsHeaders);
  }

  if (identification.status === "AMBIGUOUS_MATCH") {
    const body = buildErrorResponse(
      "AMBIGUOUS_MATCH",
      "Multiple candidate formats matched",
      identification.ambiguity ?? null,
    );
    return jsonResponse(body, 409, corsHeaders);
  }

  if (identification.status === "UNKNOWN_FORMAT" || !identification.proposed) {
    const incompatible = summarizeIncompatible(identification.results);
    if (incompatible.length > 0) {
      const body = buildErrorResponse(
        "INCOMPATIBLE",
        "Incompatible format detected",
        { incompatible },
      );
      return jsonResponse(body, 422, corsHeaders);
    }
    const body = buildErrorResponse(
      "UNKNOWN_FORMAT",
      "Unknown vendor format",
      null,
    );
    return jsonResponse(body, 422, corsHeaders);
  }

  const proposed = identification.proposed as ProposedMatch;
  const mismatch =
    (expectedId && expectedId !== proposed.id) ||
    (expectedVendorKey && expectedVendorKey !== proposed.vendorKey) ||
    (expectedDocumentType && expectedDocumentType !== proposed.documentType) ||
    (expectedFormatVersion !== null && expectedFormatVersion !== proposed.formatVersion);

  if (mismatch) {
    const body = buildErrorResponse(
      "MISMATCHED_CONFIRMATION",
      "Expected identifier does not match proposed match",
      {
        ...buildMismatchDetails({
          expectedId,
          expectedVendorKey,
          expectedDocumentType,
          expectedFormatVersion,
        }),
        proposed,
      },
    );
    return jsonResponse(body, 409, corsHeaders);
  }

  const auditBase = {
    csvText,
    filename,
    extracted: identification.extracted,
    identificationStatus: identification.status,
    proposed,
    confirmMeta: {
      expectedId,
      expectedVendorKey,
      expectedDocumentType,
      expectedFormatVersion,
      dryRun,
    },
  };

  if (dryRun) {
    const audit = buildAuditEvent({
      ...auditBase,
      handlerId: proposed.id,
      writeSummary: { dryRun: true, writesSkipped: true },
    });
    const packIntent = buildEmptyPackIntent(false, null);
    const body: IngestConfirmSuccessResponse = {
      ok: true,
      mode: "CONFIRM",
      proposed,
      writeResult: { dryRun: true, writesSkipped: true },
      audit,
      sessionId: "dry-run",
      packIntent,
    };
    return jsonResponse(body, 200, corsHeaders);
  }

  try {
    const supabaseUrl = env("SUPABASE_URL");
    const serviceRoleKey = env("SUPABASE_SERVICE_ROLE_KEY");
    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { data: vendor, error: vendorError } = await supabase
      .from("vendors")
      .select("id")
      .eq("vendor_key", proposed.vendorKey)
      .maybeSingle();
    if (vendorError || !vendor?.id) {
      throw new Error(`Vendor not found for vendorKey: ${proposed.vendorKey}`);
    }
    const handlerResult = await dispatchToHandler(proposed.id, {
      supabaseUrl,
      serviceRoleKey,
      csvText,
      filename,
    });
    const confirmMeta = {
      expectedId,
      expectedVendorKey,
      expectedDocumentType,
      expectedFormatVersion,
      dryRun,
    };
    const invoiceId =
      (handlerResult as { summary?: { invoiceId?: string | null } }).summary?.invoiceId ??
      null;
    const packIntent = await buildPackIntent({
      supabase,
      vendorId: vendor.id,
      invoiceId,
    });
    const summary =
      (handlerResult as { summary?: Record<string, unknown> | null }).summary ?? {};
    const writeSummary = {
      ...(typeof summary === "object" && summary ? summary : {}),
      packIntent,
    };
    const audit = buildAuditEvent({
      ...auditBase,
      handlerId: proposed.id,
      writeSummary,
    });
    const { data: session, error: sessionError } = await supabase
      .from("vendor_ingest_sessions")
      .insert({
        vendor_id: vendor.id,
        handler_id: proposed.id,
        filename,
        proposed,
        confirm_meta: confirmMeta,
        write_summary: writeSummary,
        audit,
        vendor_invoice_id: invoiceId,
      })
      .select("id")
      .single();
    if (sessionError || !session?.id) {
      throw new Error("Failed to persist vendor ingest session");
    }
    const body: IngestConfirmSuccessResponse = {
      ok: true,
      mode: "CONFIRM",
      proposed,
      writeResult: handlerResult,
      audit,
      sessionId: session.id,
      packIntent,
    };
    return jsonResponse(body, 200, corsHeaders);
  } catch (error) {
    if (error instanceof Error && error.message === "HANDLER_NOT_FOUND") {
      const body = buildErrorResponse(
        "HANDLER_NOT_FOUND",
        "Handler not found for proposed id",
        { id: proposed.id },
      );
      return jsonResponse(body, 500, corsHeaders);
    }
    const body = buildErrorResponse(
      "CONFIRMATION_REQUIRED",
      "Unhandled error during ingest",
      buildUnexpectedErrorPayload(error),
    );
    return jsonResponse(body, 500, corsHeaders);
  }
});
