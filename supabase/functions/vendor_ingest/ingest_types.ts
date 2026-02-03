export type IngestConfirmMode = "SNIFF_ONLY" | "CONFIRM";

export type IngestInput = {
  csvText: string;
  filename?: string | null;
  confirm: boolean;
  expectedId?: string | null;
  expectedVendorKey?: string | null;
  expectedDocumentType?: string | null;
  expectedFormatVersion?: number | null;
  dryRun?: boolean;
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

export type IngestSniffResponse = {
  ok: true;
  mode: "SNIFF_ONLY";
  extracted: object;
  status: "PROPOSED_MATCH" | "AMBIGUOUS_MATCH" | "UNKNOWN_FORMAT";
  proposed: ProposedMatch | null;
  ambiguity: object | null;
  results: object[];
};

export type IngestConfirmBlockedResponse = {
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
};

export type IngestConfirmSuccessResponse = {
  ok: true;
  mode: "CONFIRM";
  proposed: ProposedMatch;
  writeResult: object;
  audit: object;
  sessionId: string;
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
