/* apps/web/app/vendors/ingest/composites/VendorIngestFlow.tsx */
"use client";

import * as React from "react";
import { Check, FileText, Info, Loader2, Terminal, UploadCloud, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { DmFilePicker, type DmPickedFileText } from "@/components/ui/dm/file-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { analyzeVendorIngest, confirmVendorIngest } from "../lib/api";
import type { AnalyzeResponsePayload, ConfirmResponsePayload } from "../lib/types";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs">
      {children}
    </span>
  );
}

function ContractDialog() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          View contract
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[740px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            vendor_ingest contract
          </DialogTitle>
          <DialogDescription>
            Analyze is read only. Confirm locks expectedId and writes an ingest session.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="rounded-2xl border border-border/60 bg-black/40 p-4">
            <div className="mb-2 text-xs text-muted-foreground">Analyze request</div>
            <pre className="whitespace-pre-wrap text-xs leading-5 text-foreground/90">
{`{
  "confirm": false,
  "csv": "<raw csv text>"
}`}
            </pre>
          </div>

          <div className="rounded-2xl border border-border/60 bg-black/40 p-4">
            <div className="mb-2 text-xs text-muted-foreground">Confirm request</div>
            <pre className="whitespace-pre-wrap text-xs leading-5 text-foreground/90">
{`{
  "confirm": true,
  "expectedId": "<locked identifier>",
  "csv": "<same csv text>"
}`}
            </pre>
          </div>

          <div className="text-xs text-muted-foreground">
            Tip: confirm should send the same CSV text you analyzed, and expectedId must match the proposed identifier.
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function JsonDialog({
  title,
  data,
  buttonLabel,
  disabled,
}: {
  title: string;
  data: unknown;
  buttonLabel: string;
  disabled?: boolean;
}) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" disabled={disabled}>
          {buttonLabel}
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[860px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription>Raw payload for inspection and debugging.</DialogDescription>
        </DialogHeader>

        <div className="rounded-2xl border border-border/60 bg-black/40 p-4">
          <pre className="max-h-[60vh] overflow-auto whitespace-pre-wrap text-xs leading-5 text-foreground/90">
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatusBadge({ status }: { status: AnalyzeResponsePayload["status"] }) {
  const cls =
    status === "PROPOSED_MATCH"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
      : status === "AMBIGUOUS_MATCH"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
        : "border-red-500/40 bg-red-500/10 text-red-200";

  return <Badge className={cls}>{status}</Badge>;
}

export function VendorIngestFlow() {
  const [picked, setPicked] = React.useState<DmPickedFileText | null>(null);

  const [analyzeLoading, setAnalyzeLoading] = React.useState(false);
  const [analyzeError, setAnalyzeError] = React.useState<string | null>(null);
  const [analyzeResult, setAnalyzeResult] = React.useState<AnalyzeResponsePayload | null>(null);

  const [confirmLoading, setConfirmLoading] = React.useState(false);
  const [confirmError, setConfirmError] = React.useState<string | null>(null);
  const [confirmResult, setConfirmResult] = React.useState<ConfirmResponsePayload | null>(null);

  const proposed = analyzeResult?.proposed ?? null;

  const canRerunAnalyze = Boolean(picked) && !analyzeLoading && !confirmLoading;
  const canConfirm =
    Boolean(picked) &&
    analyzeResult?.status === "PROPOSED_MATCH" &&
    Boolean(proposed?.id) &&
    !analyzeLoading &&
    !confirmLoading;

  const runAnalyze = React.useCallback(async (nextPicked: DmPickedFileText) => {
    setPicked(nextPicked);

    setAnalyzeLoading(true);
    setAnalyzeError(null);
    setAnalyzeResult(null);

    setConfirmLoading(false);
    setConfirmError(null);
    setConfirmResult(null);

    try {
      const response = await analyzeVendorIngest({
        csv: nextPicked.text,
        filename: nextPicked.filename,
      });
      setAnalyzeResult(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analyze failed";
      setAnalyzeError(message);
    } finally {
      setAnalyzeLoading(false);
    }
  }, []);

  const clearAll = React.useCallback(() => {
    setPicked(null);

    setAnalyzeLoading(false);
    setAnalyzeError(null);
    setAnalyzeResult(null);

    setConfirmLoading(false);
    setConfirmError(null);
    setConfirmResult(null);
  }, []);

  const runConfirm = React.useCallback(async () => {
    if (!picked || !proposed?.id) return;

    setConfirmLoading(true);
    setConfirmError(null);
    setConfirmResult(null);

    try {
      const response = await confirmVendorIngest({
        confirm: true,
        expectedId: proposed.id,
        csv: picked.text,
        filename: picked.filename,
      });
      setConfirmResult(response);

      if ("ok" in response && response.ok === false) {
        setConfirmError(response.error?.message ?? "Confirm failed");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Confirm failed";
      setConfirmError(message);
    } finally {
      setConfirmLoading(false);
    }
  }, [picked, proposed]);

  const analyzeJsonAvailable = Boolean(analyzeResult);
  const confirmJsonAvailable = Boolean(confirmResult);

  return (
    <TooltipProvider>
      <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10">
        <header className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className={cn("text-2xl font-semibold tracking-tight", "dm-glow")}>
                  Vendor Ingest
                </h1>

                <Tooltip>
                  <TooltipTrigger asChild>
                    <button
                      type="button"
                      className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      aria-label="Ingest flow info"
                    >
                      <Info className="h-4 w-4" />
                    </button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Pick a file to analyze automatically, then confirm to write a session.</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Upload a vendor CSV and review the analyze result before confirm.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <Pill>Scope: internal tools</Pill>
              <Pill>Flow: analyze then confirm</Pill>
              <Badge variant="outline" className="gap-2">
                <UploadCloud className="h-3.5 w-3.5" />
                vendor_ingest
              </Badge>
            </div>
          </div>
        </header>

        <Card className="rounded-2xl border-border/60 bg-card/40 shadow-sm">
          <CardHeader className="space-y-2">
            <CardTitle className="text-base">Select a CSV</CardTitle>
            <CardDescription>
              Choosing a file triggers analyze automatically. Confirm is available only when a proposed match is returned.
            </CardDescription>
            <Separator />
          </CardHeader>

          <CardContent className="space-y-5">
            <DmFilePicker
              label="CSV file"
              helpText="Choose a vendor CSV export. Analyze runs automatically on select."
              onPickText={runAnalyze}
              onClear={clearAll}
              disabled={analyzeLoading || confirmLoading}
            />

            {analyzeLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing...
              </div>
            ) : null}

            {analyzeError ? (
              <Alert className="border-red-500/40 bg-red-500/10">
                <X className="h-4 w-4" />
                <AlertTitle className="text-red-100">Analyze error</AlertTitle>
                <AlertDescription className="text-red-100/80">{analyzeError}</AlertDescription>
              </Alert>
            ) : null}

            {/* Results + actions live together below the picker */}
            <Card className="rounded-2xl border-border/60 bg-muted/10">
              <CardHeader className="space-y-2">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div className="min-w-0">
                    <CardTitle className="text-base">Results</CardTitle>
                    <CardDescription>
                      Inspect JSON, optionally re-run analyze, then confirm session.
                    </CardDescription>
                  </div>

                  {/* Action bar: stable order, stable layout */}
                  <div className="flex flex-wrap items-center gap-2">
                    <ContractDialog />

                    <div className={cn(!analyzeJsonAvailable ? "invisible pointer-events-none" : "")}>
                      <JsonDialog
                        title="Analyze response"
                        data={analyzeResult ?? {}}
                        buttonLabel="Analyze JSON"
                        disabled={!analyzeJsonAvailable}
                      />
                    </div>

                    <div className={cn(!confirmJsonAvailable ? "invisible pointer-events-none" : "")}>
                      <JsonDialog
                        title="Confirm response"
                        data={confirmResult ?? {}}
                        buttonLabel="Confirm JSON"
                        disabled={!confirmJsonAvailable}
                      />
                    </div>

                    <Button
                      variant="secondary"
                      size="sm"
                      className="gap-2"
                      onClick={() => {
                        if (!picked) return;
                        void runAnalyze(picked);
                      }}
                      disabled={!canRerunAnalyze}
                    >
                      {analyzeLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Re-run analyze
                    </Button>

                    <Button size="sm" className="gap-2" onClick={runConfirm} disabled={!canConfirm}>
                      {confirmLoading ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Confirm session
                    </Button>
                  </div>
                </div>

                <Separator />
              </CardHeader>

              <CardContent className="space-y-4">
                {analyzeResult ? (
                  <div className="rounded-2xl border border-border/60 bg-background/10 p-4">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge status={analyzeResult.status} />
                      <Badge variant="outline">mode: {analyzeResult.mode}</Badge>
                      <Badge variant="outline">results: {analyzeResult.results.length}</Badge>
                      {proposed?.confidence ? (
                        <Badge variant="outline">confidence: {proposed.confidence}</Badge>
                      ) : null}
                    </div>

                    {proposed ? (
                      <div className="mt-3 grid gap-1 text-sm">
                        <div className="text-xs text-muted-foreground">Proposed</div>
                        <div className="font-mono text-xs">
                          id: <span className="text-cyan-200">{proposed.id}</span>
                        </div>
                        <div className="font-mono text-xs text-muted-foreground">
                          {proposed.vendorKey} / {proposed.documentType} v{proposed.formatVersion}
                        </div>
                      </div>
                    ) : (
                      <div className="mt-3 text-sm text-muted-foreground">No proposed match returned.</div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-border/60 bg-background/10 p-4 text-sm text-muted-foreground">
                    No results yet. Choose a file to run analyze.
                  </div>
                )}

                {confirmError ? (
                  <Alert className="border-red-500/40 bg-red-500/10">
                    <X className="h-4 w-4" />
                    <AlertTitle className="text-red-100">Confirm error</AlertTitle>
                    <AlertDescription className="text-red-100/80">{confirmError}</AlertDescription>
                  </Alert>
                ) : null}

                {confirmResult && "ok" in confirmResult && confirmResult.ok ? (
                  <Alert className="border-emerald-500/40 bg-emerald-500/10">
                    <Check className="h-4 w-4" />
                    <AlertTitle className="text-emerald-100">Confirm success</AlertTitle>
                    <AlertDescription className="text-emerald-100/80">
                      Session created. Inspect JSON for writeResult and audit.
                    </AlertDescription>
                  </Alert>
                ) : null}
              </CardContent>
            </Card>
          </CardContent>
        </Card>
      </main>
    </TooltipProvider>
  );
}