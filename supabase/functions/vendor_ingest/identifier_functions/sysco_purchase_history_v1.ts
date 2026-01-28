import { extractSignature } from "../signature_extractors.ts";
import { IdentifierFunction, IdentifyResult } from "../identifier_types.ts";

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

function buildSignatureSummary(result: {
  fileKind: "HFP_RECORD_CSV" | "HEADER_ROW_CSV" | "UNKNOWN";
  recordTypesPresent: string[];
  fFields: string[] | null;
}): IdentifyResult["signatureSummary"] {
  return {
    fileKind: result.fileKind,
    recordTypesPresent: result.recordTypesPresent,
    fFieldCount: result.fFields ? result.fFields.length : null,
  };
}

function fieldsMatch(expected: string[], actual: string[]): boolean {
  if (expected.length !== actual.length) return false;
  return expected.every((field, index) => field === actual[index]);
}

function describeFieldDifferences(expected: string[], actual: string[]): string[] {
  const warnings: string[] = [];
  warnings.push(`Expected F field count ${expected.length}, got ${actual.length}`);
  const max = Math.min(expected.length, actual.length);
  const diffs: string[] = [];
  for (let i = 0; i < max; i += 1) {
    if (expected[i] !== actual[i]) {
      diffs.push(`Index ${i + 1}: expected ${expected[i]}, got ${actual[i]}`);
    }
    if (diffs.length >= 5) break;
  }
  if (diffs.length > 0) {
    warnings.push(`First differences: ${diffs.join(" | ")}`);
  }
  return warnings;
}

export const sysco_purchase_history_v1: IdentifierFunction = async (input) => {
  const signature = input.extracted ?? extractSignature(input.csvText);
  const signatureSummary = buildSignatureSummary(signature);
  const hasHfp =
    signature.fileKind === "HFP_RECORD_CSV" &&
    signature.recordTypesPresent.includes("H") &&
    signature.recordTypesPresent.includes("F") &&
    signature.recordTypesPresent.includes("P");

  if (hasHfp && signature.fFields) {
    if (fieldsMatch(SYSCO_PURCHASE_HISTORY_V1_FIELDS, signature.fFields)) {
      return {
        id: "sysco_purchase_history_v1",
        vendorKey: "sysco",
        documentType: "purchase_history",
        formatVersion: 1,
        status: "MATCH",
        confidence: "high",
        reasons: ["F fields exact match for sysco_purchase_history_v1"],
        warnings: [],
        signatureSummary,
      };
    }

    return {
      id: "sysco_purchase_history_v1",
      vendorKey: "sysco",
      documentType: "purchase_history",
      formatVersion: 1,
      status: "INCOMPATIBLE",
      confidence: "low",
      reasons: ["HFP structure detected but F fields differ from sysco_purchase_history_v1"],
      warnings: describeFieldDifferences(SYSCO_PURCHASE_HISTORY_V1_FIELDS, signature.fFields),
      signatureSummary,
    };
  }

  return {
    id: "sysco_purchase_history_v1",
    vendorKey: "sysco",
    documentType: "purchase_history",
    formatVersion: 1,
    status: "NO_MATCH",
    confidence: "low",
    reasons: [],
    warnings: [],
    signatureSummary,
  };
};
