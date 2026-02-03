"use client";

import * as React from "react";
import { Loader2, RefreshCw } from "lucide-react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardTitleBar } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

import PackMappingRowForm, {
  type PackMappingQueueRow,
  type PackParseUpsertRequest,
} from "./PackMappingRowForm";

type QueueResponse =
  | { ok: true; rows: PackMappingQueueRow[] }
  | { ok: false; error: { message: string } };

type PackParseUpsertResponse =
  | { ok: true; parse: Record<string, unknown> }
  | { ok: false; error: { code: string; message: string; details?: object } };

type FlagUnsupportedResponse =
  | { ok: true }
  | { ok: false; error: { code: string; message: string; details?: object } };

async function postProxy<TResponse>(path: string, body: Record<string, unknown>) {
  const response = await fetch(path, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const trimmed = errorText.length > 2000 ? `${errorText.slice(0, 2000)}...` : errorText;
    throw new Error(`Request failed with ${response.status}: ${trimmed}`);
  }

  return (await response.json()) as TResponse;
}

const FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const INTERNAL_UI_SHARED_SECRET = process.env.NEXT_PUBLIC_INTERNAL_UI_SHARED_SECRET;

function buildHeaders() {
  if (!SUPABASE_ANON_KEY) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_ANON_KEY");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    apikey: SUPABASE_ANON_KEY,
  };

  if (INTERNAL_UI_SHARED_SECRET) {
    headers["x-internal-ui-secret"] = INTERNAL_UI_SHARED_SECRET;
  }

  return headers;
}

function getFunctionsUrl() {
  if (!FUNCTIONS_URL) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL");
  }

  return FUNCTIONS_URL.replace(/\/$/, "");
}

async function postSupabaseFunction<TResponse>(name: string, body: Record<string, unknown>) {
  const response = await fetch(`${getFunctionsUrl()}/${name}`, {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const errorText = await response.text();
    const trimmed = errorText.length > 2000 ? `${errorText.slice(0, 2000)}...` : errorText;
    throw new Error(`Request failed with ${response.status}: ${trimmed}`);
  }

  return (await response.json()) as TResponse;
}

function rowKey(row: PackMappingQueueRow) {
  return `${row.vendor_id}-${row.pack_string_normalized}`;
}

export default function PackMappingQueueClient() {
  const [rows, setRows] = React.useState<PackMappingQueueRow[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [closingRows, setClosingRows] = React.useState<Record<string, boolean>>({});

  const loadQueue = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await postProxy<QueueResponse>(
        "/api/vendor-pack-unmapped-queue",
        { limit: 50 },
      );
      if (!response.ok) {
        throw new Error(response.error?.message ?? "Failed to load queue.");
      }
      setRows(response.rows ?? []);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load queue.";
      setError(message);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void loadQueue();
  }, [loadQueue]);

  const handleSave = React.useCallback(async (payload: PackParseUpsertRequest) => {
    const response = await postProxy<PackParseUpsertResponse>(
      "/api/vendor-pack-parse-upsert",
      payload as unknown as Record<string, unknown>,
    );
    if (!response.ok) {
      throw new Error(response.error?.message ?? "Failed to save mapping.");
    }
  }, []);

  const handleRowSaved = React.useCallback((row: PackMappingQueueRow) => {
    const key = rowKey(row);
    setClosingRows((prev) => ({ ...prev, [key]: true }));
    window.setTimeout(() => {
      setRows((prev) => prev.filter((item) => rowKey(item) !== key));
      setClosingRows((prev) => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }, 320);
  }, []);

  const handleFlagNotSupported = React.useCallback(
    async (payload: { vendorId: string; packStringRaw: string }) => {
      const response = await postSupabaseFunction<FlagUnsupportedResponse>(
        "vendor_pack_parse_flag_unsupported_v1",
        payload,
      );
      if (!response.ok) {
        throw new Error(response.error?.message ?? "Failed to flag pack string.");
      }
    },
    [],
  );

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 p-6">
      <header className="space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Pack mapping queue</h1>
            <p className="text-sm text-muted-foreground">
              Review unmapped pack strings and confirm a structured parse.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Queue {rows.length}</Badge>
            <Button size="sm" variant="secondary" onClick={() => void loadQueue()}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </header>

      <section className="space-y-4">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-base">Global queue</CardTitle>
          </div>
          <p className="text-sm text-muted-foreground">
            Ordered by invoice line frequency across vendors. Each row shows evidence and a mapping
            form.
          </p>
          <Separator />
        </div>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading queue...
          </div>
        ) : null}

        {error ? (
          <Alert className="border-red-500/40 bg-red-500/10">
            <AlertTitle className="text-red-100">Queue error</AlertTitle>
            <AlertDescription className="text-red-100/80">{error}</AlertDescription>
          </Alert>
        ) : null}

        {!loading && !error && rows.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-muted/20 p-4 text-sm text-muted-foreground">
            No unmapped pack strings found.
          </div>
        ) : null}

        {rows.length > 0 ? (
          <div className="grid gap-4">
            {rows.map((row) => {
              const key = rowKey(row);
              const isClosing = closingRows[key];
              return (
                <div
                  key={key}
                  className={`overflow-hidden transition-[max-height,opacity] duration-300 ease-in-out ${
                    isClosing ? "max-h-0 opacity-0" : "max-h-[600px] opacity-100"
                  }`}
                >
                  <Card className="border-border/60 bg-card/60">
                    <CardHeader className="border-b border-border/60">
                      <CardTitleBar
                        title={row.description ?? "n/a"}
                        siblingTitle={row.pack_string_normalized}
                        subtitle={`${row.vendor_key} · ${row.vendor_invoice_number} · ${
                          row.invoice_date
                        } · ${row.vendor_sku ?? "n/a"} · ${row.line_count} lines · ${
                          row.pack_string_raw
                        }`}
                      />
                    </CardHeader>
                    <CardContent className="p-4">
                      <PackMappingRowForm
                        row={row}
                        onSave={handleSave}
                        onFlagNotSupported={handleFlagNotSupported}
                        onSaved={() => handleRowSaved(row)}
                      />
                    </CardContent>
                  </Card>
                </div>
              );
            })}
          </div>
        ) : null}
      </section>
    </main>
  );
}
