import { extractSignature } from "../signature_extractors.ts";
import {
  detectDelimiterFromFirstLine,
  normalizeToken,
  splitCsvLineSimple,
} from "../signature_extractors.ts";
import { ExtractedSignature } from "../identifier_types.ts";

const REQUIRED_F_LABELS: string[] = [
  "SUPC",
  "CASE QTY",
  "SPLIT QTY",
  "PACK/SIZE",
  "BRAND",
  "DESCRIPTION",
  "PER LB",
  "CASE $",
  "EACH $",
];

type IngestArgs = {
  supabase: any;
  vendorKey: string;
  csvText: string;
  extracted?: ExtractedSignature;
};

type ParsedLine = {
  vendor_sku: string | null;
  vendor_sku_normalized: string | null;
  description: string | null;
  brand: string | null;
  pack_size_text: string | null;
  quantity: number | null;
  uom: string | null;
  unit_price_cents: number | null;
  extended_price_cents: number | null;
  raw: Record<string, unknown>;
  vendor_catalog_item_id: string | null;
  unmatched: boolean;
  unmatched_reason: string | null;
};

function requireHfp(extracted: ExtractedSignature): void {
  if (extracted.fileKind !== "HFP_RECORD_CSV") {
    throw new Error("Expected H/F/P record CSV");
  }
}

function parseDateMmddyyyy(value: string): string {
  const trimmed = value.trim();
  const match = trimmed.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!match) {
    throw new Error(`Invalid invoice date: ${value}`);
  }
  const month = Number(match[1]);
  const day = Number(match[2]);
  const year = Number(match[3]);
  if (!Number.isFinite(month) || !Number.isFinite(day) || !Number.isFinite(year)) {
    throw new Error(`Invalid invoice date: ${value}`);
  }
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function parseNumber(value: string): number | null {
  const match = value.trim().match(/-?\d+(?:\.\d+)?/);
  if (!match) return null;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseMoneyToCents(value: string): number | null {
  const parsed = parseNumber(value);
  if (parsed === null) return null;
  return Math.round(parsed * 100);
}

function normalizeSku(value: string): string {
  return value.trim().toUpperCase().replace(/\s+/g, "");
}

function buildFieldIndex(labels: string[]): Record<string, number> {
  const index: Record<string, number> = {};
  labels.forEach((label, idx) => {
    index[label] = idx;
  });
  return index;
}

function getFieldValue(values: string[], fieldIndex: Record<string, number>, field: string): string {
  const idx = fieldIndex[field];
  if (idx === undefined) return "";
  return values[idx] ?? "";
}

async function loadVendorId(supabase: any, vendorKey: string): Promise<string> {
  const { data, error } = await supabase
    .from("vendors")
    .select("id")
    .eq("vendor_key", vendorKey)
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load vendor id: ${error.message}`);
  }
  if (!data?.id) {
    throw new Error(`Vendor id not found for ${vendorKey}`);
  }
  return data.id as string;
}

function trimTrailingEmptyLabels(labels: string[]): string[] {
  const trimmed = [...labels];
  while (trimmed.length > 0 && trimmed[trimmed.length - 1] === "") {
    trimmed.pop();
  }
  return trimmed;
}

function buildRawPFields(labels: string[], values: string[]): Record<string, string> {
  const fields: Record<string, string> = {};
  labels.forEach((label, idx) => {
    fields[label] = values[idx] ?? "";
  });
  return fields;
}

export async function ingestSyscoInvoiceV1(args: IngestArgs): Promise<{
  vendorKey: string;
  vendorInvoiceNumber: string;
  invoiceDate: string;
  totalRowsSeen: number;
  linesInserted: number;
  linesUnmatched: number;
  invoiceId: string;
  sampleLines: Array<{
    vendorSku: string | null;
    vendorSkuNormalized: string | null;
    description: string | null;
    quantity: number | null;
    uom: string | null;
    unitPriceCents: number | null;
    extendedPriceCents: number | null;
    unmatched: boolean;
  }>;
}> {
  const extractedSignature = args.extracted ?? extractSignature(args.csvText);
  requireHfp(extractedSignature);

  const lines = args.csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const delimiter = detectDelimiterFromFirstLine(lines[0] ?? "");

  let hTokens: string[] | null = null;
  let fLabelsRaw: string[] | null = null;
  const pRows: Array<{ tokens: string[]; values: string[]; lineIndex: number }> = [];

  lines.forEach((line, lineIndex) => {
    const tokens = splitCsvLineSimple(line, delimiter);
    const recordType = normalizeToken(tokens[0] ?? "");
    if (recordType === "H" && !hTokens) {
      hTokens = tokens;
    } else if (recordType === "F" && !fLabelsRaw) {
      fLabelsRaw = tokens.slice(1);
    } else if (recordType === "P") {
      pRows.push({ tokens, values: tokens.slice(1), lineIndex });
    }
  });

  if (!hTokens) {
    throw new Error("Missing H record");
  }
  if (!fLabelsRaw) {
    throw new Error("Missing F record");
  }

  const fLabelsNormalized = trimTrailingEmptyLabels(
    fLabelsRaw.map((label) => normalizeToken(label)),
  );
  const fieldIndex = buildFieldIndex(fLabelsNormalized);

  const missingLabels = REQUIRED_F_LABELS.filter((label) => fieldIndex[label] === undefined);
  if (missingLabels.length > 0) {
    throw new Error(
      `Missing required F labels: ${missingLabels.join(", ")}. ` +
        `Detected labels: ${fLabelsNormalized.join(", ")}`,
    );
  }

  const vendorInvoiceNumberCandidate =
    (hTokens[9] ?? "").trim() || (hTokens[10] ?? "").trim();
  if (!vendorInvoiceNumberCandidate) {
    throw new Error("Missing vendor invoice number");
  }

  const invoiceDate = parseDateMmddyyyy(hTokens[5] ?? "");
  const totalCents = parseMoneyToCents(hTokens[11] ?? "");

  const vendorId = await loadVendorId(args.supabase, args.vendorKey);

  const normalizedSkus = new Set<string>();
  const parsedLines: ParsedLine[] = [];

  pRows.forEach((row) => {
    const vendorSkuRaw = getFieldValue(row.values, fieldIndex, "SUPC").trim();
    const vendorSkuNormalized = vendorSkuRaw ? normalizeSku(vendorSkuRaw) : "";
    if (vendorSkuNormalized) {
      normalizedSkus.add(vendorSkuNormalized);
    }

    const caseQty = parseNumber(getFieldValue(row.values, fieldIndex, "CASE QTY"));
    const splitQty = parseNumber(getFieldValue(row.values, fieldIndex, "SPLIT QTY"));
    const casePrice = parseMoneyToCents(getFieldValue(row.values, fieldIndex, "CASE $"));
    const eachPrice = parseMoneyToCents(getFieldValue(row.values, fieldIndex, "EACH $"));

    let quantity: number | null = null;
    let uom: string | null = null;
    let unitPriceCents: number | null = null;

    if (caseQty !== null && caseQty > 0) {
      quantity = caseQty;
      uom = "CASE";
      unitPriceCents = casePrice;
    } else if (splitQty !== null && splitQty > 0) {
      quantity = splitQty;
      uom = "EACH";
      unitPriceCents = eachPrice;
    }

    const extendedPriceCents =
      quantity !== null && unitPriceCents !== null
        ? Math.round(quantity * unitPriceCents)
        : null;

    const description = getFieldValue(row.values, fieldIndex, "DESCRIPTION").trim();
    const brand = getFieldValue(row.values, fieldIndex, "BRAND").trim();
    const packSizeText = getFieldValue(row.values, fieldIndex, "PACK/SIZE").trim();

    parsedLines.push({
      vendor_sku: vendorSkuRaw || null,
      vendor_sku_normalized: vendorSkuNormalized || null,
      description: description || null,
      brand: brand || null,
      pack_size_text: packSizeText || null,
      quantity,
      uom,
      unit_price_cents: unitPriceCents,
      extended_price_cents: extendedPriceCents,
      raw: {
        recordType: "P",
        rowIndex: row.lineIndex + 1,
        tokens: row.tokens,
        fields: buildRawPFields(fLabelsNormalized, row.values),
      },
      vendor_catalog_item_id: null,
      unmatched: true,
      unmatched_reason: "NO_CATALOG_MATCH",
    });
  });

  let catalogMap = new Map<string, string>();
  const skuList = Array.from(normalizedSkus.values());
  if (skuList.length > 0) {
    const { data: catalogRows, error: catalogError } = await args.supabase
      .from("vendor_catalog_items")
      .select("id, vendor_sku_normalized")
      .eq("vendor_id", vendorId)
      .in("vendor_sku_normalized", skuList);

    if (catalogError) {
      throw new Error(`Failed to load vendor catalog items: ${catalogError.message}`);
    }

    catalogMap = new Map(
      (catalogRows ?? []).map((row: { id: string; vendor_sku_normalized: string }) => [
        row.vendor_sku_normalized,
        row.id,
      ]),
    );
  }

  const enrichedLines = parsedLines.map((line) => {
    if (!line.vendor_sku_normalized) {
      return line;
    }
    const matchId = catalogMap.get(line.vendor_sku_normalized);
    if (!matchId) {
      return line;
    }
    return {
      ...line,
      vendor_catalog_item_id: matchId,
      unmatched: false,
      unmatched_reason: null,
    };
  });

  const invoiceRaw = {
    recordType: "H",
    tokens: hTokens,
    fields: {
      site_or_route_code: hTokens[1] ?? "",
      location_number: hTokens[2] ?? "",
      customer_number: hTokens[3] ?? "",
      created_at_text: hTokens[4] ?? "",
      invoice_date: hTokens[5] ?? "",
      vendor_invoice_number: vendorInvoiceNumberCandidate,
      total_dollars: hTokens[11] ?? "",
      status: hTokens[13] ?? "",
    },
    f_fields: fLabelsNormalized,
  };

  const { data: invoiceRows, error: invoiceError } = await args.supabase
    .from("vendor_invoices")
    .upsert(
      [
        {
          vendor_id: vendorId,
          vendor_invoice_number: vendorInvoiceNumberCandidate,
          invoice_date: invoiceDate,
          location_key: null,
          currency: "USD",
          total_cents: totalCents,
          subtotal_cents: null,
          tax_cents: null,
          raw: invoiceRaw,
        },
      ],
      { onConflict: "vendor_id,vendor_invoice_number" },
    )
    .select("id");

  if (invoiceError) {
    throw new Error(`Failed to upsert vendor invoice: ${invoiceError.message}`);
  }

  const invoiceId = invoiceRows?.[0]?.id as string | undefined;
  if (!invoiceId) {
    throw new Error("Failed to resolve vendor invoice id");
  }

  const { error: deleteError } = await args.supabase
    .from("vendor_invoice_lines")
    .delete()
    .eq("vendor_invoice_id", invoiceId);

  if (deleteError) {
    throw new Error(`Failed to clear existing invoice lines: ${deleteError.message}`);
  }

  const lineRows = enrichedLines.map((line, idx) => ({
    vendor_invoice_id: invoiceId,
    line_number: idx + 1,
    vendor_sku: line.vendor_sku,
    vendor_sku_normalized: line.vendor_sku_normalized,
    vendor_catalog_item_id: line.vendor_catalog_item_id,
    description: line.description,
    quantity: line.quantity,
    unit_price_cents: line.unit_price_cents,
    extended_price_cents: line.extended_price_cents,
    uom: line.uom,
    unmatched: line.unmatched,
    unmatched_reason: line.unmatched_reason,
    raw: {
      ...line.raw,
      brand: line.brand,
      pack_size_text: line.pack_size_text,
    },
  }));

  if (lineRows.length > 0) {
    const { error: insertError } = await args.supabase
      .from("vendor_invoice_lines")
      .insert(lineRows);

    if (insertError) {
      throw new Error(`Failed to insert vendor invoice lines: ${insertError.message}`);
    }
  }

  const linesUnmatched = enrichedLines.filter((line) => line.unmatched).length;
  const sampleLines = enrichedLines.slice(0, 5).map((line) => ({
    vendorSku: line.vendor_sku,
    vendorSkuNormalized: line.vendor_sku_normalized,
    description: line.description,
    quantity: line.quantity,
    uom: line.uom,
    unitPriceCents: line.unit_price_cents,
    extendedPriceCents: line.extended_price_cents,
    unmatched: line.unmatched,
  }));

  return {
    vendorKey: args.vendorKey,
    vendorInvoiceNumber: vendorInvoiceNumberCandidate,
    invoiceDate,
    totalRowsSeen: pRows.length,
    linesInserted: lineRows.length,
    linesUnmatched,
    invoiceId,
    sampleLines,
  };
}
