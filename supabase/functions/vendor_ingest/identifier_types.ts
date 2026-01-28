export type IdentifierConfidence = "high" | "medium" | "low";
export type IdentifyStatus = "MATCH" | "NO_MATCH" | "INCOMPATIBLE";
export type FileKind = "HFP_RECORD_CSV" | "HEADER_ROW_CSV" | "UNKNOWN";

export type ExtractedSignature = {
  fileKind: FileKind;
  recordTypesPresent: string[];
  fFields: string[] | null;
  headerRow: string[] | null;
  sampleLines: string[];
  delimiter: "," | "\t" | ";";
  notes: string[];
};

export type IdentifyResult = {
  id: string;
  vendorKey: string;
  documentType: string;
  formatVersion: number;
  status: IdentifyStatus;
  confidence: IdentifierConfidence;
  reasons: string[];
  warnings: string[];
  signatureSummary: {
    fileKind: FileKind;
    recordTypesPresent: string[];
    fFieldCount: number | null;
  };
};

export type IdentifierFunction = (input: {
  csvText: string;
  filename?: string | null;
  extracted?: ExtractedSignature;
}) => Promise<IdentifyResult>;
