import { extractSignature } from "./signature_extractors.ts";
import {
  ExtractedSignature,
  IdentifierConfidence,
  IdentifyResult,
  IdentifierFunction,
} from "./identifier_types.ts";
import { sysco_purchase_history_v1 } from "./identifier_functions/sysco_purchase_history_v1.ts";
import { sysco_invoice_v1 } from "./identifier_functions/sysco_invoice_v1.ts";

export const IDENTIFIERS: IdentifierFunction[] = [
  sysco_purchase_history_v1,
  sysco_invoice_v1,
];

type ProposedMatch = {
  id: string;
  vendorKey: string;
  documentType: string;
  formatVersion: number;
  confidence: IdentifierConfidence;
  reasons: string[];
  warnings: string[];
};

type Ambiguity = {
  candidates: Array<{
    id: string;
    vendorKey: string;
    documentType: string;
    formatVersion: number;
    confidence: IdentifierConfidence;
    reasons: string[];
  }>;
};

export async function runIdentification(input: {
  csvText: string;
  filename?: string | null;
}): Promise<{
  extracted: ExtractedSignature;
  results: IdentifyResult[];
  best: IdentifyResult | null;
  status: "PROPOSED_MATCH" | "AMBIGUOUS_MATCH" | "UNKNOWN_FORMAT";
  proposed: ProposedMatch | null;
  ambiguity: Ambiguity | null;
}> {
  const extracted = extractSignature(input.csvText);
  const results: IdentifyResult[] = [];

  for (const identifier of IDENTIFIERS) {
    const result = await identifier({
      csvText: input.csvText,
      filename: input.filename ?? null,
      extracted,
    });
    results.push(result);
  }

  const matches = results.filter((result) => result.status === "MATCH");
  const highMatches = matches.filter((result) => result.confidence === "high");
  const mediumMatches = matches.filter((result) => result.confidence === "medium");

  if (highMatches.length === 1) {
    const best = highMatches[0];
    return {
      extracted,
      results,
      best,
      status: "PROPOSED_MATCH",
      proposed: {
        id: best.id,
        vendorKey: best.vendorKey,
        documentType: best.documentType,
        formatVersion: best.formatVersion,
        confidence: best.confidence,
        reasons: best.reasons,
        warnings: best.warnings,
      },
      ambiguity: null,
    };
  }

  if (highMatches.length > 1) {
    return {
      extracted,
      results,
      best: null,
      status: "AMBIGUOUS_MATCH",
      proposed: null,
      ambiguity: {
        candidates: highMatches.map((result) => ({
          id: result.id,
          vendorKey: result.vendorKey,
          documentType: result.documentType,
          formatVersion: result.formatVersion,
          confidence: result.confidence,
          reasons: result.reasons,
        })),
      },
    };
  }

  if (mediumMatches.length === 1) {
    const best = mediumMatches[0];
    return {
      extracted,
      results,
      best,
      status: "PROPOSED_MATCH",
      proposed: {
        id: best.id,
        vendorKey: best.vendorKey,
        documentType: best.documentType,
        formatVersion: best.formatVersion,
        confidence: best.confidence,
        reasons: best.reasons,
        warnings: best.warnings,
      },
      ambiguity: null,
    };
  }

  return {
    extracted,
    results,
    best: null,
    status: "UNKNOWN_FORMAT",
    proposed: null,
    ambiguity: null,
  };
}
