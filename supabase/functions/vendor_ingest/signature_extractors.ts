import { ExtractedSignature, FileKind } from "./identifier_types.ts";

export function normalizeToken(s: string): string {
  return s.trim().replace(/\s+/g, " ").toUpperCase();
}

export function detectDelimiterFromFirstLine(line: string): "," | "\t" | ";" {
  const counts = {
    ",": (line.match(/,/g) ?? []).length,
    "\t": (line.match(/\t/g) ?? []).length,
    ";": (line.match(/;/g) ?? []).length,
  } as const;

  let best: "," | "\t" | ";" = ",";
  let bestCount = counts[","];
  (["\t", ";"] as const).forEach((delimiter) => {
    if (counts[delimiter] > bestCount) {
      best = delimiter;
      bestCount = counts[delimiter];
    }
  });

  return best;
}

export function splitCsvLineSimple(line: string, delimiter: string): string[] {
  const tokens: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i += 1) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i += 1;
        continue;
      }
      inQuotes = !inQuotes;
      continue;
    }
    if (!inQuotes && ch === delimiter) {
      tokens.push(current);
      current = "";
      continue;
    }
    current += ch;
  }
  tokens.push(current);
  return tokens;
}

function isNumericToken(token: string): boolean {
  const trimmed = token.trim();
  if (!trimmed) return false;
  return /^[0-9.\-]+$/.test(trimmed);
}

function isHfpToken(token: string): token is "H" | "F" | "P" {
  return token === "H" || token === "F" || token === "P";
}

export function extractSignature(csvText: string, maxLines = 80): ExtractedSignature {
  const lines = csvText.split(/\r?\n/);
  const nonEmptyLines: string[] = [];
  for (const line of lines) {
    if (line.trim().length === 0) continue;
    nonEmptyLines.push(line);
    if (nonEmptyLines.length >= maxLines) break;
  }

  const sampleLines = nonEmptyLines.slice(0, 5);
  const firstLine = nonEmptyLines[0] ?? "";
  const delimiter = detectDelimiterFromFirstLine(firstLine);
  const tokenized = nonEmptyLines.map((line) => splitCsvLineSimple(line, delimiter));

  const recordTypesPresent: string[] = [];
  let hfpCount = 0;
  let fFields: string[] | null = null;
  const notes: string[] = [];

  for (const tokens of tokenized) {
    const firstToken = normalizeToken(tokens[0] ?? "");
    if (isHfpToken(firstToken)) {
      hfpCount += 1;
      if (!recordTypesPresent.includes(firstToken)) {
        recordTypesPresent.push(firstToken);
      }
      if (firstToken === "F" && !fFields) {
        const rawFields = tokens.slice(1).map((field) => normalizeToken(field));
        while (rawFields.length > 0 && rawFields[rawFields.length - 1] === "") {
          rawFields.pop();
        }
        fFields = rawFields;
      }
    }
  }

  const hfpMajority = tokenized.length > 0 && hfpCount >= Math.ceil(tokenized.length / 2);
  if (hfpMajority) {
    notes.push("HFP structure detected from record type majority");
    return {
      fileKind: "HFP_RECORD_CSV",
      recordTypesPresent,
      fFields,
      headerRow: null,
      sampleLines,
      delimiter,
      notes,
    };
  }

  let headerRow: string[] | null = null;
  if (tokenized.length > 0) {
    const firstRow = tokenized[0];
    const normalized = firstRow.map((token) => normalizeToken(token));
    const nonNumericCount = firstRow.filter((token) => !isNumericToken(token)).length;
    const hasLetters = normalized.some((token) => /[A-Z]/.test(token));
    if (nonNumericCount >= Math.ceil(firstRow.length * 0.6) && hasLetters) {
      headerRow = normalized;
      notes.push("Header row detected from non numeric label row");
    }
  }

  const fileKind: FileKind = headerRow ? "HEADER_ROW_CSV" : "UNKNOWN";
  return {
    fileKind,
    recordTypesPresent: [],
    fFields: null,
    headerRow,
    sampleLines,
    delimiter,
    notes,
  };
}
