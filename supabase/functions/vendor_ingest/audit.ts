import { ExtractedSignature } from "./identifier_types.ts";
import { ProposedMatch } from "./ingest_types.ts";

type AuditArgs = {
  csvText: string;
  filename: string | null;
  extracted: ExtractedSignature;
  identificationStatus: "PROPOSED_MATCH" | "AMBIGUOUS_MATCH" | "UNKNOWN_FORMAT";
  proposed: ProposedMatch | null;
  confirmMeta: {
    expectedId: string | null;
    expectedVendorKey: string | null;
    expectedDocumentType: string | null;
    expectedFormatVersion: number | null;
    dryRun: boolean;
  };
  handlerId: string | null;
  writeSummary: object | null;
};

export function buildAuditEvent(args: AuditArgs): object {
  const csvByteLength = new TextEncoder().encode(args.csvText).length;
  return {
    occurredAt: new Date().toISOString(),
    filename: args.filename,
    csvByteLength,
    signature: {
      fileKind: args.extracted.fileKind,
      recordTypesPresent: args.extracted.recordTypesPresent,
      fFieldCount: args.extracted.fFields ? args.extracted.fFields.length : null,
    },
    identification: {
      status: args.identificationStatus,
      proposedId: args.proposed?.id ?? null,
    },
    confirmMeta: {
      expectedId: args.confirmMeta.expectedId,
      expectedVendorKey: args.confirmMeta.expectedVendorKey,
      expectedDocumentType: args.confirmMeta.expectedDocumentType,
      expectedFormatVersion: args.confirmMeta.expectedFormatVersion,
      dryRun: args.confirmMeta.dryRun,
    },
    handlerId: args.handlerId,
    writeSummary: args.writeSummary,
  };
}
