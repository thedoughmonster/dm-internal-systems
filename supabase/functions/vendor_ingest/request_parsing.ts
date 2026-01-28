type ParsedMeta = {
  confirm: boolean;
  expectedId: string | null;
  expectedVendorKey: string | null;
  expectedDocumentType: string | null;
  expectedFormatVersion: number | null;
  dryRun: boolean;
};

function parseBoolean(value: string | null): boolean {
  return value === "true";
}

function parseNumber(value: string | null): number | null {
  if (!value) return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizeOptionalString(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value : null;
}

function parseJsonMeta(parsed: Record<string, unknown>): {
  csvText: string | null;
  filename: string | null;
  meta: ParsedMeta;
} {
  const csvCandidate = parsed.csv;
  const csvText = typeof csvCandidate === "string" ? csvCandidate : null;
  const filename = normalizeOptionalString(parsed.filename ?? null);
  const expectedFormatVersion =
    typeof parsed.expectedFormatVersion === "number"
      ? parsed.expectedFormatVersion
      : null;
  return {
    csvText,
    filename,
    meta: {
      confirm: parsed.confirm === true,
      expectedId: normalizeOptionalString(parsed.expectedId ?? null),
      expectedVendorKey: normalizeOptionalString(parsed.expectedVendorKey ?? null),
      expectedDocumentType: normalizeOptionalString(parsed.expectedDocumentType ?? null),
      expectedFormatVersion:
        expectedFormatVersion !== null && Number.isFinite(expectedFormatVersion)
          ? expectedFormatVersion
          : null,
      dryRun: parsed.dryRun === true,
    },
  };
}

function parseQueryMeta(url: URL): {
  filename: string | null;
  meta: ParsedMeta;
} {
  const confirm = parseBoolean(url.searchParams.get("confirm"));
  const expectedId = url.searchParams.get("expectedId");
  const expectedVendorKey = url.searchParams.get("expectedVendorKey");
  const expectedDocumentType = url.searchParams.get("expectedDocumentType");
  const expectedFormatVersion = parseNumber(url.searchParams.get("expectedFormatVersion"));
  const dryRun = parseBoolean(url.searchParams.get("dryRun"));
  const filename = url.searchParams.get("filename");
  return {
    filename: normalizeOptionalString(filename),
    meta: {
      confirm,
      expectedId: normalizeOptionalString(expectedId),
      expectedVendorKey: normalizeOptionalString(expectedVendorKey),
      expectedDocumentType: normalizeOptionalString(expectedDocumentType),
      expectedFormatVersion,
      dryRun,
    },
  };
}

export async function readCsvAndMeta(req: Request): Promise<{
  csvText: string;
  filename: string | null;
  meta: ParsedMeta;
}> {
  const bodyText = await req.text();
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    let parsed: Record<string, unknown>;
    try {
      parsed = JSON.parse(bodyText) as Record<string, unknown>;
    } catch {
      throw new Error("INVALID_JSON");
    }
    const { csvText, filename, meta } = parseJsonMeta(parsed);
    if (!csvText || !csvText.trim()) {
      throw new Error("MISSING_CSV");
    }
    return { csvText, filename, meta };
  }

  const url = new URL(req.url);
  const { filename, meta } = parseQueryMeta(url);
  if (!bodyText || !bodyText.trim()) {
    throw new Error("MISSING_CSV");
  }
  return { csvText: bodyText, filename, meta };
}
