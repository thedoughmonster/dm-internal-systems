import PackApplyForm from "./PackApplyForm";
import PackParseForm from "./PackParseForm";

type PackParse = {
  id: string;
  vendor_id: string;
  pack_string_normalized: string;
  pack_qty: number;
  pack_uom: string;
  pack_size: number;
  pack_size_uom: string;
  verified_at: string;
  verified_by: string | null;
  evidence: Record<string, unknown> | null;
};

type InvoiceLine = {
  id: string;
  vendor_catalog_item_id: string | null;
  vendor_sku: string | null;
  description: string | null;
  pack_string_raw: string;
};

type PackGroup = {
  normalized: string;
  rawSamples: string[];
  lines: InvoiceLine[];
};

type CatalogOption = {
  id: string;
  label: string;
};

type SessionRecord = {
  id: string;
  vendor_id: string;
  vendor_invoice_id: string | null;
};

type InvoiceLineRecord = {
  id: string;
  vendor_catalog_item_id: string | null;
  vendor_sku: string | null;
  description: string | null;
  raw: Record<string, unknown> | null;
};

type PackVerificationPanelProps = {
  sessionId: string;
};

function buildCatalogOptions(lines: InvoiceLine[]): CatalogOption[] {
  const seen = new Map<string, string>();
  lines.forEach((line) => {
    if (!line.vendor_catalog_item_id) return;
    const labelParts = [line.vendor_sku ?? "", line.description ?? ""]
      .map((part) => part.trim())
      .filter(Boolean);
    const label = labelParts.length > 0 ? labelParts.join(" | ") : line.vendor_catalog_item_id;
    seen.set(line.vendor_catalog_item_id, label);
  });
  return Array.from(seen.entries()).map(([id, label]) => ({ id, label }));
}

function normalizePackString(input: string): string {
  const trimmed = input.trim();
  let out = "";
  let lastWasSpace = false;
  for (const ch of trimmed) {
    const isSpace = ch === " " || ch === "\t" || ch === "\n" || ch === "\r";
    if (isSpace) {
      if (!lastWasSpace) {
        out += " ";
        lastWasSpace = true;
      }
      continue;
    }
    out += ch.toUpperCase();
    lastWasSpace = false;
  }
  return out;
}

function buildInFilter(values: string[]): string {
  if (values.length === 0) return "";
  const quoted = values.map((value) => `"${value.replace(/\"/g, "\\\"")}"`);
  return `in.(${quoted.join(",")})`;
}

async function fetchJson<T>(url: string, anonKey: string): Promise<T> {
  const response = await fetch(url, {
    headers: {
      apikey: anonKey,
      Authorization: `Bearer ${anonKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(`Request failed with ${response.status}: ${text}`);
  }

  return (await response.json()) as T;
}

export default async function PackVerificationPanel({
  sessionId,
}: PackVerificationPanelProps) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !anonKey) {
    const missing = [
      !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !anonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
    ].filter(Boolean);
    return (
      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Pack verification
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          Missing env var: {missing.join(", ")}
        </p>
      </section>
    );
  }

  const baseUrl = supabaseUrl.replace(/\/$/, "");

  const sessionUrl = `${baseUrl}/rest/v1/vendor_ingest_sessions?select=id,vendor_id,vendor_invoice_id&id=eq.${encodeURIComponent(
    sessionId,
  )}`;
  const sessions = await fetchJson<SessionRecord[]>(sessionUrl, anonKey);
  const session = sessions[0];

  if (!session) {
    return (
      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Pack verification
        </h2>
        <p className="mt-2 text-sm text-slate-600">Session not found.</p>
      </section>
    );
  }

  if (!session.vendor_invoice_id) {
    return (
      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Pack verification
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          No invoice attached to this ingest session.
        </p>
      </section>
    );
  }

  const linesUrl = `${baseUrl}/rest/v1/vendor_invoice_lines?select=id,vendor_catalog_item_id,vendor_sku,description,raw&vendor_invoice_id=eq.${encodeURIComponent(
    session.vendor_invoice_id,
  )}`;
  const lines = await fetchJson<InvoiceLineRecord[]>(linesUrl, anonKey);

  const groups = new Map<string, PackGroup>();

  lines.forEach((line) => {
    const rawValue =
      line.raw && typeof line.raw === "object"
        ? (line.raw as Record<string, unknown>).pack_size_text
        : null;
    if (typeof rawValue !== "string" || !rawValue.trim()) {
      return;
    }
    const normalized = normalizePackString(rawValue);
    const existing = groups.get(normalized);
    const entry = existing ?? {
      normalized,
      rawSamples: [],
      lines: [],
    };
    if (!entry.rawSamples.includes(rawValue) && entry.rawSamples.length < 3) {
      entry.rawSamples.push(rawValue);
    }
    entry.lines.push({
      id: line.id,
      vendor_catalog_item_id: line.vendor_catalog_item_id,
      vendor_sku: line.vendor_sku,
      description: line.description,
      pack_string_raw: rawValue,
    });
    groups.set(normalized, entry);
  });

  if (groups.size === 0) {
    return (
      <section className="mt-8 rounded-lg border border-slate-200 bg-white p-6">
        <h2 className="text-lg font-semibold text-slate-900">
          Pack verification
        </h2>
        <p className="mt-2 text-sm text-slate-600">
          No invoice lines with pack strings were found for this session.
        </p>
      </section>
    );
  }

  const normalizedValues = Array.from(groups.keys());
  let parseMap: Record<string, PackParse> = {};

  const parseParams = new URLSearchParams({
    select:
      "id,vendor_id,pack_string_normalized,pack_qty,pack_uom,pack_size,pack_size_uom,verified_at,verified_by,evidence",
    vendor_id: `eq.${session.vendor_id}`,
    pack_string_normalized: buildInFilter(normalizedValues),
  });
  const parseUrl = `${baseUrl}/rest/v1/vendor_pack_string_parses?${parseParams.toString()}`;
  const parses = await fetchJson<PackParse[]>(parseUrl, anonKey);
  parseMap = parses.reduce<Record<string, PackParse>>((acc, parse) => {
    acc[parse.pack_string_normalized] = parse;
    return acc;
  }, {});

  return (
    <section className="mt-8 space-y-6">
      <h2 className="text-lg font-semibold text-slate-900">
        Pack verification
      </h2>
      {Array.from(groups.values()).map((group) => {
        const parse = parseMap[group.normalized];
        const catalogOptions = buildCatalogOptions(group.lines);
        const evidence = {
          sessionId,
          lineIds: group.lines.map((line) => line.id),
          rawSamples: group.rawSamples,
        };

        return (
          <div
            key={group.normalized}
            className="rounded-lg border border-slate-200 bg-white p-5"
          >
            <div className="flex flex-col gap-2">
              <div className="text-sm text-slate-600">Normalized</div>
              <div className="text-sm font-semibold text-slate-900">
                {group.normalized}
              </div>
              <div className="text-xs text-slate-500">
                Raw samples: {group.rawSamples.join(" | ")}
              </div>
              <div className="text-xs text-slate-500">
                Lines: {group.lines.length}
              </div>
            </div>
            <div className="mt-4">
              {parse ? (
                <PackApplyForm
                  vendorId={session.vendor_id}
                  packStringRaw={group.rawSamples[0] ?? group.normalized}
                  packStringNormalized={group.normalized}
                  parse={parse}
                  catalogOptions={catalogOptions}
                  evidence={evidence}
                />
              ) : (
                <PackParseForm
                  vendorId={session.vendor_id}
                  packStringRaw={group.rawSamples[0] ?? group.normalized}
                  packStringNormalized={group.normalized}
                  evidence={evidence}
                />
              )}
            </div>
          </div>
        );
      })}
    </section>
  );
}
