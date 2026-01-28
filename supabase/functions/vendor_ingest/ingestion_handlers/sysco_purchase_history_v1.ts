import { SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { ExtractedSignature } from "../identifier_types.ts";
import {
  detectDelimiterFromFirstLine,
  normalizeToken,
  splitCsvLineSimple,
} from "../signature_extractors.ts";

const SYSCO_PURCHASE_HISTORY_V1_FIELDS: string[] = [
  "SUPC",
  "CASE QTY",
  "SPLIT QTY",
  "CODE",
  "ITEM STATUS",
  "REPLACED ITEM",
  "PACK",
  "SIZE",
  "UNIT",
  "BRAND",
  "MFR #",
  "DESC",
  "CAT",
  "CASE $",
  "SPLIT $",
  "PER LB",
  "MARKET",
  "SPLITTABLE",
  "SPLITS",
  "MIN SPLIT",
  "NET WT",
  "LEAD TIME",
  "STOCK",
  "SUBSTITUTE",
  "AGR",
];

type IngestArgs = {
  csvText: string;
  extractedSignature: ExtractedSignature;
  supabaseClient: SupabaseClient;
};

type CatalogItemUpsert = {
  vendor_id: string;
  vendor_sku: string;
  vendor_sku_normalized: string;
  brand: string | null;
  description: string | null;
  uom: string | null;
  pack_qty: number | null;
  pack_uom: string | null;
  pack_size: number | null;
  pack_size_uom: string | null;
  raw: Record<string, unknown>;
  is_active: boolean;
  source_updated_at: string;
};

function fieldsMatch(expected: string[], actual: string[]): boolean {
  if (expected.length !== actual.length) return false;
  return expected.every((field, index) => field === actual[index]);
}

function assertSignature(extractedSignature: ExtractedSignature): void {
  if (extractedSignature.fileKind !== "HFP_RECORD_CSV") {
    throw new Error("Expected HFP_RECORD_CSV signature for sysco_purchase_history_v1");
  }
  if (!extractedSignature.fFields) {
    throw new Error("Expected F fields for sysco_purchase_history_v1");
  }
  if (!fieldsMatch(SYSCO_PURCHASE_HISTORY_V1_FIELDS, extractedSignature.fFields)) {
    throw new Error("F fields do not match sysco_purchase_history_v1");
  }
}

function buildFieldIndex(fields: string[]): Record<string, number> {
  const index: Record<string, number> = {};
  fields.forEach((field, idx) => {
    index[field] = idx;
  });
  return index;
}

function getFieldValue(tokens: string[], fieldIndex: Record<string, number>, field: string): string {
  const idx = fieldIndex[field];
  if (idx === undefined) return "";
  return tokens[idx] ?? "";
}

function parseNumericPrefix(value: string): number | null {
  const match = value.trim().match(/^([0-9]+(?:\.[0-9]+)?)/);
  if (!match) return null;
  const parsed = Number(match[1]);
  return Number.isFinite(parsed) ? parsed : null;
}

function parseSize(value: string): { size: number; uom: string } | null {
  const trimmed = value.trim();
  if (!trimmed) return null;
  const match = trimmed.match(/^([0-9]+(?:\.[0-9]+)?)\s*([A-Za-z]+)$/);
  if (!match) return null;
  const size = Number(match[1]);
  if (!Number.isFinite(size)) return null;
  const uom = match[2].toUpperCase();
  return { size, uom };
}

async function loadSyscoVendorId(supabaseClient: SupabaseClient): Promise<string> {
  const { data, error } = await supabaseClient
    .from("vendors")
    .select("id")
    .eq("vendor_key", "sysco")
    .maybeSingle();

  if (error) {
    throw new Error(`Failed to load sysco vendor id: ${error.message}`);
  }
  if (!data?.id) {
    throw new Error("Sysco vendor id not found");
  }
  return data.id as string;
}

function buildRawRow(fields: string[], values: string[], rowIndex: number): Record<string, unknown> {
  const rawFields: Record<string, string> = {};
  fields.forEach((field, idx) => {
    rawFields[field] = values[idx] ?? "";
  });
  return {
    recordType: "P",
    rowIndex,
    fields: rawFields,
  };
}

function derivePackSize(
  sizeField: string,
  netWtField: string,
  unitField: string,
): { packSize: number | null; packSizeUom: string | null } {
  const parsedSize = parseSize(sizeField);
  if (parsedSize) {
    return {
      packSize: parsedSize.size,
      packSizeUom: parsedSize.uom,
    };
  }

  const netWtValue = parseNumericPrefix(netWtField);
  const unitTrimmed = unitField.trim();
  if (netWtValue !== null && unitTrimmed) {
    return {
      packSize: netWtValue,
      packSizeUom: unitTrimmed,
    };
  }

  return { packSize: null, packSizeUom: null };
}

export async function ingestSyscoPurchaseHistoryV1(args: IngestArgs): Promise<{
  vendorKey: "sysco";
  documentType: "purchase_history";
  formatVersion: 1;
  totals: {
    total_rows_seen: number;
    rows_upserted: number;
    rows_updated: number;
    rows_skipped: number;
  };
  sample: Array<{
    vendor_sku: string;
    vendor_sku_normalized: string;
    pack: string | null;
    size: string | null;
    unit: string | null;
    net_wt: string | null;
    brand: string | null;
    description: string | null;
  }>;
}> {
  assertSignature(args.extractedSignature);

  const vendorId = await loadSyscoVendorId(args.supabaseClient);
  const lines = args.csvText.split(/\r?\n/).filter((line) => line.trim().length > 0);
  const delimiter = detectDelimiterFromFirstLine(lines[0] ?? "");
  const fFields = args.extractedSignature.fFields ?? [];
  const fieldIndex = buildFieldIndex(fFields);
  const nowIso = new Date().toISOString();

  let totalRowsSeen = 0;
  let rowsSkipped = 0;
  const itemsBySku = new Map<string, CatalogItemUpsert>();
  const orderedSkus: string[] = [];
  const sampleRows: Array<{
    vendor_sku: string;
    vendor_sku_normalized: string;
    pack: string | null;
    size: string | null;
    unit: string | null;
    net_wt: string | null;
    brand: string | null;
    description: string | null;
  }> = [];

  lines.forEach((line, lineIndex) => {
    const tokens = splitCsvLineSimple(line, delimiter);
    const recordType = normalizeToken(tokens[0] ?? "");
    if (recordType !== "P") return;
    totalRowsSeen += 1;

    const values = tokens.slice(1);
    const vendorSkuRaw = getFieldValue(values, fieldIndex, "SUPC").trim();
    const vendorSkuNormalized = normalizeToken(vendorSkuRaw);
    if (!vendorSkuNormalized) {
      rowsSkipped += 1;
      return;
    }

    const packField = getFieldValue(values, fieldIndex, "PACK").trim();
    const sizeField = getFieldValue(values, fieldIndex, "SIZE").trim();
    const unitField = getFieldValue(values, fieldIndex, "UNIT").trim();
    const netWtField = getFieldValue(values, fieldIndex, "NET WT").trim();
    const packQty = parseNumericPrefix(packField);
    const packSize = derivePackSize(sizeField, netWtField, unitField);

    const item: CatalogItemUpsert = {
      vendor_id: vendorId,
      vendor_sku: vendorSkuRaw,
      vendor_sku_normalized: vendorSkuNormalized,
      brand: getFieldValue(values, fieldIndex, "BRAND").trim() || null,
      description: getFieldValue(values, fieldIndex, "DESC").trim() || null,
      uom: unitField || null,
      pack_qty: packQty,
      pack_uom: unitField || null,
      pack_size: packSize.packSize,
      pack_size_uom: packSize.packSizeUom,
      raw: buildRawRow(fFields, values, lineIndex + 1),
      is_active: true,
      source_updated_at: nowIso,
    };

    if (!itemsBySku.has(vendorSkuNormalized)) {
      orderedSkus.push(vendorSkuNormalized);
    }
    itemsBySku.set(vendorSkuNormalized, item);

    if (sampleRows.length < 3) {
      sampleRows.push({
        vendor_sku: vendorSkuRaw,
        vendor_sku_normalized: vendorSkuNormalized,
        pack: packField || null,
        size: sizeField || null,
        unit: unitField || null,
        net_wt: netWtField || null,
        brand: item.brand,
        description: item.description,
      });
    }
  });

  const items = orderedSkus.map((sku) => itemsBySku.get(sku)!).filter(Boolean);

  let rowsUpdated = 0;
  if (items.length > 0) {
    const skus = items.map((item) => item.vendor_sku_normalized);
    const { data: existingRows, error: existingError } = await args.supabaseClient
      .from("vendor_catalog_items")
      .select("vendor_sku_normalized")
      .eq("vendor_id", vendorId)
      .in("vendor_sku_normalized", skus);

    if (existingError) {
      throw new Error(`Failed to check existing catalog items: ${existingError.message}`);
    }

    const existingSet = new Set(
      (existingRows ?? []).map((row) => row.vendor_sku_normalized as string),
    );
    rowsUpdated = items.filter((item) => existingSet.has(item.vendor_sku_normalized)).length;

    const { error: upsertError } = await args.supabaseClient
      .from("vendor_catalog_items")
      .upsert(items, { onConflict: "vendor_id,vendor_sku_normalized" });

    if (upsertError) {
      throw new Error(`Failed to upsert vendor catalog items: ${upsertError.message}`);
    }
  }

  const rowsUpserted = items.length - rowsUpdated;
  return {
    vendorKey: "sysco",
    documentType: "purchase_history",
    formatVersion: 1,
    totals: {
      total_rows_seen: totalRowsSeen,
      rows_upserted: rowsUpserted,
      rows_updated: rowsUpdated,
      rows_skipped: rowsSkipped,
    },
    sample: sampleRows,
  };
}
