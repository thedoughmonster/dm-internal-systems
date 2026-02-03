export const ANALYZE_STATUS = {
  OK_COMPATIBLE: "ANALYZE_OK_COMPATIBLE",
  KNOWN_INCOMPATIBLE: "ANALYZE_KNOWN_INCOMPATIBLE",
  UNKNOWN_VENDOR_OR_TYPE: "ANALYZE_UNKNOWN_VENDOR_OR_TYPE",
  INVALID_STRUCTURE: "ANALYZE_INVALID_STRUCTURE",
  INTERNAL_ERROR: "ANALYZE_INTERNAL_ERROR",
} as const;

export type AnalyzeStatus =
  (typeof ANALYZE_STATUS)[keyof typeof ANALYZE_STATUS];

export const CONFIRM_STATUS = {
  SUCCESS: "CONFIRM_SUCCESS",
  REJECTED_MISMATCH: "CONFIRM_REJECTED_MISMATCH",
  ALREADY_INGESTED: "CONFIRM_ALREADY_INGESTED",
  INTERNAL_ERROR: "CONFIRM_INTERNAL_ERROR",
} as const;

export type ConfirmStatus =
  (typeof CONFIRM_STATUS)[keyof typeof CONFIRM_STATUS];

export type IngestSessionId = string;

export type AnalyzeRequestPayload = {
  csv: string;
  filename?: string;
  confirm?: false;
  expectedId?: string;
  expectedVendorKey?: string;
  expectedDocumentType?: string;
  expectedFormatVersion?: number;
  dryRun?: boolean;
};

export type ConfirmRequestPayload = {
  csv: string;
  filename?: string;
  confirm: true;
  expectedId: string;
  expectedVendorKey?: string;
  expectedDocumentType?: string;
  expectedFormatVersion?: number;
  dryRun?: boolean;
};

export type AnalyzeResponsePayload = {
  ok: true;
  mode: "SNIFF_ONLY";
  extracted: object;
  status: "PROPOSED_MATCH" | "AMBIGUOUS_MATCH" | "UNKNOWN_FORMAT";
  proposed: ProposedMatch | null;
  ambiguity: object | null;
  results: object[];
};

export type ProposedMatch = {
  id: string;
  vendorKey: string;
  documentType: string;
  formatVersion: number;
  confidence: "high" | "medium" | "low";
  reasons: string[];
  warnings: string[];
};

export type ConfirmResponsePayload =
  | {
      ok: false;
      mode: "CONFIRM";
      error: {
        code:
          | "CONFIRMATION_REQUIRED"
          | "MISMATCHED_CONFIRMATION"
          | "AMBIGUOUS_MATCH"
          | "UNKNOWN_FORMAT"
          | "INCOMPATIBLE"
          | "HANDLER_NOT_FOUND";
        message: string;
        details?: object;
      };
    }
  | {
      ok: true;
      mode: "CONFIRM";
      proposed: ProposedMatch;
      writeResult: object;
      audit: object;
      sessionId: IngestSessionId;
      packIntent: PackIntent;
    };

export type PackIntent = {
  applicable: boolean;
  vendorInvoiceId: string | null;
  unmappedPackLineCount: number;
  unmappedPackGroupCount: number;
  unmappedPackGroups: Array<{
    packStringNormalized: string;
    lineCount: number;
    rawSamples: string[];
    sampleLine: { vendorSku: string | null; description: string | null };
  }>;
};
