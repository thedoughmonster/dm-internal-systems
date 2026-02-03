/* apps/web/app/vendors/ingest/composites/VendorIngestFlow.tsx */
"use client";

import * as React from "react";
import Link from "next/link";
import { Check, FileText, Info, Loader2, Terminal, UploadCloud, X } from "lucide-react";

import { cn } from "@/lib/utils";

import { DmMultiFilePicker } from "@/components/ui/dm/multi-file-picker";
import type { DmPickedFileText } from "@/components/ui/dm/file-picker";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import type { AnalyzeResponsePayload, ConfirmResponsePayload, PackIntent } from "../lib/types";

function Pill({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full border border-border/60 bg-muted/40 px-2.5 py-1 text-xs">
      {children}
    </span>
  );
}

function ContractDialog() {
  const dialogId = "vendor-ingest-contract";
  return (
    <Dialog id={`${dialogId}-dialog`}>
      <DialogTrigger id={`${dialogId}-trigger`} asChild>
        <Button id={`${dialogId}-button`} variant="outline" size="sm" className="gap-2">
          <FileText className="h-4 w-4" />
          View contract
        </Button>
      </DialogTrigger>

      <DialogContent id={`${dialogId}-content`} className="sm:max-w-[740px]">
        <DialogHeader id={`${dialogId}-header`}>
          <DialogTitle id={`${dialogId}-title`} className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            vendor_ingest contract
          </DialogTitle>
          <DialogDescription id={`${dialogId}-description`}>
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
  id,
  title,
  data,
  buttonLabel,
  disabled,
}: {
  id: string;
  title: string;
  data: unknown;
  buttonLabel: string;
  disabled?: boolean;
}) {
  return (
    <Dialog id={`${id}-dialog`}>
      <DialogTrigger id={`${id}-trigger`} asChild>
        <Button id={`${id}-button`} variant="outline" size="sm" disabled={disabled}>
          {buttonLabel}
        </Button>
      </DialogTrigger>

      <DialogContent id={`${id}-content`} className="sm:max-w-[860px]">
        <DialogHeader id={`${id}-header`}>
          <DialogTitle id={`${id}-title`} className="flex items-center gap-2">
            <Terminal className="h-4 w-4" />
            {title}
          </DialogTitle>
          <DialogDescription id={`${id}-description`}>
            Raw payload for inspection and debugging.
          </DialogDescription>
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

function StatusBadge({
  id,
  status,
}: {
  id: string;
  status: AnalyzeResponsePayload["status"];
}) {
  const cls =
    status === "PROPOSED_MATCH"
      ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-200"
      : status === "AMBIGUOUS_MATCH"
        ? "border-amber-500/40 bg-amber-500/10 text-amber-200"
        : "border-red-500/40 bg-red-500/10 text-red-200";

  return (
    <Badge id={id} className={cls}>
      {status}
    </Badge>
  );
}

type FileEntry = {
  id: string;
  picked: DmPickedFileText;
  analyzeStatus: "idle" | "loading" | "done" | "error";
  analyzeResult: AnalyzeResponsePayload | null;
  analyzeError: string | null;
  confirmStatus: "idle" | "loading" | "done" | "error";
  confirmResult: ConfirmResponsePayload | null;
  confirmError: string | null;
};

type ConfirmAllSummary = {
  skipped: Array<{ id: string; filename: string; reason: string }>;
};

function createLimiter(limit: number) {
  let active = 0;
  const queue: Array<() => void> = [];

  const acquire = () =>
    new Promise<() => void>((resolve) => {
      const tryAcquire = () => {
        if (active < limit) {
          active += 1;
          resolve(() => {
            active = Math.max(0, active - 1);
            const next = queue.shift();
            if (next) next();
          });
        } else {
          queue.push(tryAcquire);
        }
      };
      tryAcquire();
    });

  return async function runWithLimit<T>(fn: () => Promise<T>): Promise<T> {
    const release = await acquire();
    try {
      return await fn();
    } finally {
      release();
    }
  };
}

function isConfirmSuccess(result: ConfirmResponsePayload | null): result is Extract<
  ConfirmResponsePayload,
  { ok: true }
> {
  return Boolean(result && "ok" in result && result.ok);
}

function buildEntryId(picked: DmPickedFileText, index: number) {
  return `${picked.filename}-${picked.lastModifiedMs}-${picked.sizeBytes}-${index}`;
}

function PackIntentTable({
  id,
  packIntent,
}: {
  id: string;
  packIntent: PackIntent;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-border/60">
      <Table id={`${id}-table`}>
        <TableHeader
          id={`${id}-table-header`}
          className="text-xs uppercase tracking-wide text-muted-foreground"
        >
          <TableRow id={`${id}-table-header-row`} className="border-border/40">
            <TableHead id={`${id}-table-head-pack`} className="p-3">
              Pack string
            </TableHead>
            <TableHead id={`${id}-table-head-lines`} className="p-3">
              Lines
            </TableHead>
            <TableHead id={`${id}-table-head-samples`} className="p-3">
              Samples
            </TableHead>
            <TableHead id={`${id}-table-head-sample-line`} className="p-3">
              Sample line
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody id={`${id}-table-body`}>
          {packIntent.unmappedPackGroups.map((group) => (
            <TableRow
              id={`${id}-table-row-${group.packStringNormalized.replace(/[^a-z0-9]+/gi, "-")}`}
              key={group.packStringNormalized}
              className="border-border/40"
            >
              <TableCell
                id={`${id}-table-cell-${group.packStringNormalized.replace(/[^a-z0-9]+/gi, "-")}-pack`}
                className="p-3 text-xs font-mono text-foreground/90"
              >
                {group.packStringNormalized}
              </TableCell>
              <TableCell
                id={`${id}-table-cell-${group.packStringNormalized.replace(/[^a-z0-9]+/gi, "-")}-lines`}
                className="p-3 text-xs"
              >
                {group.lineCount}
              </TableCell>
              <TableCell
                id={`${id}-table-cell-${group.packStringNormalized.replace(/[^a-z0-9]+/gi, "-")}-samples`}
                className="p-3 text-xs"
              >
                {group.rawSamples.length > 0 ? (
                  <div className="grid gap-1">
                    {group.rawSamples.map((sample) => (
                      <div key={sample} className="font-mono text-xs text-muted-foreground">
                        {sample}
                      </div>
                    ))}
                  </div>
                ) : (
                  <span className="text-muted-foreground">n/a</span>
                )}
              </TableCell>
              <TableCell
                id={`${id}-table-cell-${group.packStringNormalized.replace(/[^a-z0-9]+/gi, "-")}-sample-line`}
                className="p-3 text-xs"
              >
                {group.sampleLine.vendorSku || group.sampleLine.description ? (
                  <div className="grid gap-1">
                    {group.sampleLine.vendorSku ? (
                      <div className="font-mono text-xs">{group.sampleLine.vendorSku}</div>
                    ) : null}
                    {group.sampleLine.description ? (
                      <div className="text-muted-foreground">{group.sampleLine.description}</div>
                    ) : null}
                  </div>
                ) : (
                  <span className="text-muted-foreground">n/a</span>
                )}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

export function VendorIngestFlow() {
  const flowId = "vendor-ingest-flow";
  const [entries, setEntries] = React.useState<FileEntry[]>([]);
  const [confirmAllSummary, setConfirmAllSummary] = React.useState<ConfirmAllSummary | null>(null);
  const [confirmAllLoading, setConfirmAllLoading] = React.useState(false);

  const analyzeLimiter = React.useRef(createLimiter(3));
  const confirmLimiter = React.useRef(createLimiter(3));

  const updateEntry = React.useCallback(
    (id: string, updater: (entry: FileEntry) => FileEntry) => {
      setEntries((prev) => prev.map((entry) => (entry.id === id ? updater(entry) : entry)));
    },
    [],
  );

  const runAnalyzeForEntry = React.useCallback(
    async (entry: FileEntry) => {
      updateEntry(entry.id, (current) => ({
        ...current,
        analyzeStatus: "loading",
        analyzeError: null,
        analyzeResult: null,
        confirmStatus: "idle",
        confirmError: null,
        confirmResult: null,
      }));

      try {
        const response = await analyzeLimiter.current(() =>
          analyzeVendorIngest({
            csv: entry.picked.text,
            filename: entry.picked.filename,
          }),
        );
        updateEntry(entry.id, (current) => ({
          ...current,
          analyzeStatus: "done",
          analyzeResult: response,
          analyzeError: null,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Analyze failed";
        updateEntry(entry.id, (current) => ({
          ...current,
          analyzeStatus: "error",
          analyzeError: message,
        }));
      }
    },
    [updateEntry],
  );

  const runConfirmForEntry = React.useCallback(
    async (entry: FileEntry) => {
      const proposedId = entry.analyzeResult?.proposed?.id;
      if (!proposedId) return;

      updateEntry(entry.id, (current) => ({
        ...current,
        confirmStatus: "loading",
        confirmError: null,
        confirmResult: null,
      }));

      try {
        const response = await confirmLimiter.current(() =>
          confirmVendorIngest({
            confirm: true,
            expectedId: proposedId,
            csv: entry.picked.text,
            filename: entry.picked.filename,
          }),
        );
        const errorMessage =
          "ok" in response && response.ok === false
            ? response.error?.message ?? "Confirm failed"
            : null;
        updateEntry(entry.id, (current) => ({
          ...current,
          confirmStatus: "done",
          confirmResult: response,
          confirmError: errorMessage,
        }));
      } catch (err) {
        const message = err instanceof Error ? err.message : "Confirm failed";
        updateEntry(entry.id, (current) => ({
          ...current,
          confirmStatus: "error",
          confirmError: message,
        }));
      }
    },
    [updateEntry],
  );

  const handlePickedFiles = React.useCallback(
    async (pickedFiles: DmPickedFileText[]) => {
      const nextEntries: FileEntry[] = pickedFiles.map((picked, index) => ({
        id: buildEntryId(picked, index),
        picked,
        analyzeStatus: "idle",
        analyzeResult: null,
        analyzeError: null,
        confirmStatus: "idle",
        confirmResult: null,
        confirmError: null,
      }));
      setEntries(nextEntries);
      setConfirmAllSummary(null);
      await Promise.all(nextEntries.map((entry) => runAnalyzeForEntry(entry)));
    },
    [runAnalyzeForEntry],
  );

  const clearAll = React.useCallback(() => {
    setEntries([]);
    setConfirmAllSummary(null);
    setConfirmAllLoading(false);
  }, []);

  const analyzeInFlight = entries.some((entry) => entry.analyzeStatus === "loading");
  const confirmInFlight = entries.some((entry) => entry.confirmStatus === "loading");
  const hasAnalyzeOutputs = entries.some((entry) => entry.analyzeResult || entry.analyzeError);

  const getConfirmSkipReason = React.useCallback((entry: FileEntry): string | null => {
    if (entry.analyzeStatus === "loading") return "Analyze still running.";
    if (entry.analyzeError) return "Analyze failed.";
    if (!entry.analyzeResult) return "No analyze result.";
    if (entry.analyzeResult.status !== "PROPOSED_MATCH") {
      return `Analyze status ${entry.analyzeResult.status}.`;
    }
    if (!entry.analyzeResult.proposed?.id) return "Missing proposed match.";
    if (entry.confirmStatus === "loading") return "Confirm in progress.";
    if (isConfirmSuccess(entry.confirmResult)) return "Already confirmed.";
    return null;
  }, []);

  const eligibleEntries = entries.filter((entry) => !getConfirmSkipReason(entry));
  const canConfirmAll = eligibleEntries.length > 0 && !confirmAllLoading;

  const runConfirmAll = React.useCallback(async () => {
    const skipped: ConfirmAllSummary["skipped"] = [];
    const eligible: FileEntry[] = [];

    for (const entry of entries) {
      const reason = getConfirmSkipReason(entry);
      if (reason) {
        skipped.push({
          id: entry.id,
          filename: entry.picked.filename,
          reason,
        });
      } else {
        eligible.push(entry);
      }
    }

    setConfirmAllSummary({ skipped });

    if (eligible.length === 0) return;

    setConfirmAllLoading(true);
    try {
      await Promise.all(eligible.map((entry) => runConfirmForEntry(entry)));
    } finally {
      setConfirmAllLoading(false);
    }
  }, [entries, getConfirmSkipReason, runConfirmForEntry]);

  return (
    <TooltipProvider id={`${flowId}-tooltip-provider`}>
      <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10">
        <header className="space-y-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h1 className={cn("text-2xl font-semibold tracking-tight", "dm-glow")}>
                  Vendor Ingest
                </h1>

                <Tooltip id={`${flowId}-info-tooltip`}>
                  <TooltipTrigger id={`${flowId}-info-tooltip-trigger`} asChild>
                    <Button
                      id={`${flowId}-info-button`}
                      type="button"
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 border-border/60 bg-muted/30 text-muted-foreground hover:bg-muted/40 hover:text-foreground"
                      aria-label="Ingest flow info"
                    >
                      <Info className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent id={`${flowId}-info-tooltip-content`}>
                    <p>Select files to analyze automatically, then confirm each eligible session.</p>
                  </TooltipContent>
                </Tooltip>
              </div>

              <p className="mt-1 text-sm text-muted-foreground">
                Upload vendor CSVs and review the analyze results before confirm.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <ContractDialog />
              <Pill>Scope: internal tools</Pill>
              <Pill>Flow: analyze then confirm</Pill>
              <Badge id={`${flowId}-badge-ingest`} variant="outline" className="gap-2">
                <UploadCloud className="h-3.5 w-3.5" />
                vendor_ingest
              </Badge>
            </div>
          </div>
        </header>

        <Card id={`${flowId}-select-card`} className="rounded-2xl border-border/60 bg-card/40 shadow-sm">
          <CardHeader id={`${flowId}-select-header`} className="space-y-2">
            <CardTitle id={`${flowId}-select-title`} className="text-base">
              Select CSV files
            </CardTitle>
            <CardDescription id={`${flowId}-select-description`}>
              Choosing files triggers analyze automatically. Confirm is available only when a proposed match is returned.
            </CardDescription>
            <Separator id={`${flowId}-select-separator`} />
          </CardHeader>

          <CardContent id={`${flowId}-select-content`} className="space-y-5">
            <DmMultiFilePicker
              id={`${flowId}-file-picker`}
              label="CSV files"
              helpText="Choose vendor CSV exports. Analyze runs automatically for each file."
              onPickText={handlePickedFiles}
              onClear={clearAll}
              disabled={analyzeInFlight || confirmInFlight || confirmAllLoading}
            />

            {analyzeInFlight && !hasAnalyzeOutputs ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="h-4 w-4 animate-spin" />
                Analyzing files...
              </div>
            ) : null}
          </CardContent>
        </Card>

        {hasAnalyzeOutputs ? (
          <Card id={`${flowId}-results-card`} className="rounded-2xl border-border/60 bg-muted/10">
            <CardHeader id={`${flowId}-results-header`} className="space-y-2">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                <div className="min-w-0">
                  <CardTitle id={`${flowId}-results-title`} className="text-base">
                    Results
                  </CardTitle>
                  <CardDescription id={`${flowId}-results-description`}>
                    Review each file, inspect payloads, then confirm sessions.
                  </CardDescription>
                </div>

                <div className="flex flex-wrap items-center gap-2">
                  <Badge id={`${flowId}-results-files`} variant="outline">
                    Files {entries.length}
                  </Badge>
                  <Badge id={`${flowId}-results-eligible`} variant="outline">
                    Eligible {eligibleEntries.length}
                  </Badge>
                  <Button
                    id={`${flowId}-confirm-all`}
                    size="sm"
                    className="gap-2"
                    onClick={() => void runConfirmAll()}
                    disabled={!canConfirmAll}
                  >
                    {confirmAllLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                    Confirm all eligible
                  </Button>
                </div>
              </div>

              <Separator id={`${flowId}-results-separator`} />
            </CardHeader>

            <CardContent id={`${flowId}-results-content`} className="space-y-4">
              {confirmAllSummary?.skipped.length ? (
                <Alert id={`${flowId}-confirm-summary`} className="border-amber-500/40 bg-amber-500/10">
                  <AlertTitle id={`${flowId}-confirm-summary-title`} className="text-amber-100">
                    Confirm all summary
                  </AlertTitle>
                  <AlertDescription id={`${flowId}-confirm-summary-description`} className="text-amber-100/80">
                    <div className="mt-2 space-y-2 text-xs">
                      {confirmAllSummary.skipped.map((item) => (
                        <div key={item.id} className="flex flex-col gap-1">
                          <span className="font-mono text-amber-50">{item.filename}</span>
                          <span className="text-amber-100/80">{item.reason}</span>
                        </div>
                      ))}
                    </div>
                  </AlertDescription>
                </Alert>
              ) : null}

              <div className="grid gap-4">
                {entries.map((entry) => {
                  const entryId = `${flowId}-entry-${entry.id}`;
                  const proposed = entry.analyzeResult?.proposed ?? null;
                  const analyzeJsonAvailable = Boolean(entry.analyzeResult);
                  const confirmJsonAvailable = Boolean(entry.confirmResult);
                  const confirmResult = isConfirmSuccess(entry.confirmResult)
                    ? entry.confirmResult
                    : null;
                  const packIntent = confirmResult?.packIntent ?? null;
                  const canRerunAnalyze =
                    entry.analyzeStatus !== "loading" && entry.confirmStatus !== "loading";
                  const canConfirm = !getConfirmSkipReason(entry) && !confirmAllLoading;

                  return (
                    <Card id={`${entryId}-card`} key={entry.id} className="rounded-2xl border-border/60 bg-background/5">
                      <CardHeader id={`${entryId}-header`} className="space-y-2">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <CardTitle id={`${entryId}-title`} className="text-sm">
                              {entry.picked.filename}
                            </CardTitle>
                            <CardDescription id={`${entryId}-description`}>
                              {entry.picked.contentType || "text/csv"}
                            </CardDescription>
                          </div>

                          <div className="flex flex-wrap items-center gap-2">
                            <div
                              className={cn(!analyzeJsonAvailable ? "invisible pointer-events-none" : "")}
                            >
                              <JsonDialog
                                id={`${entryId}-analyze-json`}
                                title="Analyze response"
                                data={entry.analyzeResult ?? {}}
                                buttonLabel="Analyze JSON"
                                disabled={!analyzeJsonAvailable}
                              />
                            </div>

                            <div
                              className={cn(!confirmJsonAvailable ? "invisible pointer-events-none" : "")}
                            >
                              <JsonDialog
                                id={`${entryId}-confirm-json`}
                                title="Confirm response"
                                data={entry.confirmResult ?? {}}
                                buttonLabel="Confirm JSON"
                                disabled={!confirmJsonAvailable}
                              />
                            </div>

                            <Button
                              id={`${entryId}-rerun-analyze`}
                              variant="secondary"
                              size="sm"
                              className="gap-2"
                              onClick={() => void runAnalyzeForEntry(entry)}
                              disabled={!canRerunAnalyze}
                            >
                              {entry.analyzeStatus === "loading" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Re-run analyze
                            </Button>

                            <Button
                              id={`${entryId}-confirm-session`}
                              size="sm"
                              className="gap-2"
                              onClick={() => void runConfirmForEntry(entry)}
                              disabled={!canConfirm}
                            >
                              {entry.confirmStatus === "loading" ? (
                                <Loader2 className="h-4 w-4 animate-spin" />
                              ) : (
                                <Check className="h-4 w-4" />
                              )}
                              Confirm session
                            </Button>
                          </div>
                        </div>

                        <Separator id={`${entryId}-separator`} />
                      </CardHeader>

                      <CardContent id={`${entryId}-content`} className="space-y-4">
                        {entry.analyzeStatus === "loading" ? (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Analyzing...
                          </div>
                        ) : null}

                        {entry.analyzeError ? (
                          <Alert id={`${entryId}-analyze-error`} className="border-red-500/40 bg-red-500/10">
                            <X className="h-4 w-4" />
                            <AlertTitle id={`${entryId}-analyze-error-title`} className="text-red-100">
                              Analyze error
                            </AlertTitle>
                            <AlertDescription id={`${entryId}-analyze-error-description`} className="text-red-100/80">
                              {entry.analyzeError}
                            </AlertDescription>
                          </Alert>
                        ) : null}

                        {entry.analyzeResult ? (
                          <div className="rounded-2xl border border-border/60 bg-background/10 p-4">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusBadge
                                id={`${entryId}-status-badge`}
                                status={entry.analyzeResult.status}
                              />
                              <Badge id={`${entryId}-mode-badge`} variant="outline">
                                mode: {entry.analyzeResult.mode}
                              </Badge>
                              <Badge id={`${entryId}-results-badge`} variant="outline">
                                results: {entry.analyzeResult.results.length}
                              </Badge>
                              {proposed?.confidence ? (
                                <Badge id={`${entryId}-confidence-badge`} variant="outline">
                                  confidence: {proposed.confidence}
                                </Badge>
                              ) : null}
                            </div>

                            {proposed ? (
                              <div className="mt-3 grid gap-1 text-sm">
                                <div className="text-xs text-muted-foreground">Proposed</div>
                                <div className="font-mono text-xs">
                                  id: <span className="text-cyan-200">{proposed.id}</span>
                                </div>
                                <div className="font-mono text-xs text-muted-foreground">
                                  {proposed.vendorKey} / {proposed.documentType} v
                                  {proposed.formatVersion}
                                </div>
                              </div>
                            ) : (
                              <div className="mt-3 text-sm text-muted-foreground">
                                No proposed match returned.
                              </div>
                            )}
                          </div>
                        ) : null}

                        {entry.confirmError ? (
                          <Alert id={`${entryId}-confirm-error`} className="border-red-500/40 bg-red-500/10">
                            <X className="h-4 w-4" />
                            <AlertTitle id={`${entryId}-confirm-error-title`} className="text-red-100">
                              Confirm error
                            </AlertTitle>
                            <AlertDescription id={`${entryId}-confirm-error-description`} className="text-red-100/80">
                              {entry.confirmError}
                            </AlertDescription>
                          </Alert>
                        ) : null}

                        {confirmResult ? (
                          <Alert id={`${entryId}-confirm-success`} className="border-emerald-500/40 bg-emerald-500/10">
                            <Check className="h-4 w-4" />
                            <AlertTitle id={`${entryId}-confirm-success-title`} className="text-emerald-100">
                              Confirm success
                            </AlertTitle>
                            <AlertDescription id={`${entryId}-confirm-success-description`} className="text-emerald-100/80">
                              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                                <span>Session:</span>
                                <Button id={`${entryId}-session-link`} variant="link" size="sm" asChild>
                                  <Link
                                    href={`/vendors/ingest/sessions/${confirmResult.sessionId}`}
                                    target="_blank"
                                    rel="noreferrer"
                                  >
                                    <span className="font-mono">
                                      {confirmResult.sessionId}
                                    </span>
                                  </Link>
                                </Button>
                              </div>
                            </AlertDescription>
                          </Alert>
                        ) : null}

                        {confirmResult ? (
                          packIntent?.applicable ? (
                            packIntent.unmappedPackGroupCount > 0 ? (
                              <Alert id={`${entryId}-pack-intent-unmapped`} className="border-amber-500/40 bg-amber-500/10">
                                <AlertTitle id={`${entryId}-pack-intent-unmapped-title`} className="text-amber-100">
                                  Unmapped pack sizes
                                </AlertTitle>
                                <AlertDescription id={`${entryId}-pack-intent-unmapped-description`} className="text-amber-100/80">
                                  <details className="mt-2 rounded-lg border border-border/60 bg-background/10 p-3">
                                    <summary className="cursor-pointer text-sm font-medium text-amber-50">
                                      {packIntent.unmappedPackGroupCount} groups,{" "}
                                      {packIntent.unmappedPackLineCount} lines
                                    </summary>
                                    <div className="mt-3 space-y-3">
                                      <PackIntentTable id={`${entryId}-pack-intent-table`} packIntent={packIntent} />
                                    </div>
                                  </details>
                                  <div className="mt-3">
                                    <Button id={`${entryId}-pack-intent-open`} variant="secondary" size="sm" asChild>
                                      <Link href="/vendors/ingest/pack-mapping">
                                        Open pack mapping
                                      </Link>
                                    </Button>
                                  </div>
                                </AlertDescription>
                              </Alert>
                            ) : (
                              <Alert id={`${entryId}-pack-intent-none`} className="border-amber-500/40 bg-amber-500/10">
                                <AlertTitle id={`${entryId}-pack-intent-none-title`} className="text-amber-100">
                                  Pack sizes
                                </AlertTitle>
                                <AlertDescription id={`${entryId}-pack-intent-none-description`} className="text-amber-100/80">
                                  No unmapped pack sizes found.
                                  <div className="mt-3">
                                    <Button id={`${entryId}-pack-intent-none-open`} variant="secondary" size="sm" asChild>
                                      <Link href="/vendors/ingest/pack-mapping">
                                        Open pack mapping
                                      </Link>
                                    </Button>
                                  </div>
                                </AlertDescription>
                              </Alert>
                            )
                          ) : (
                            <Alert id={`${entryId}-pack-intent-missing`} className="border-amber-500/40 bg-amber-500/10">
                              <AlertTitle id={`${entryId}-pack-intent-missing-title`} className="text-amber-100">
                                Pack sizes
                              </AlertTitle>
                              <AlertDescription id={`${entryId}-pack-intent-missing-description`} className="text-amber-100/80">
                                Pack sizes not available for this session.
                                <div className="mt-3">
                                  <Button id={`${entryId}-pack-intent-missing-open`} variant="secondary" size="sm" asChild>
                                    <Link href="/vendors/ingest/pack-mapping">
                                      Open pack mapping
                                    </Link>
                                  </Button>
                                </div>
                              </AlertDescription>
                            </Alert>
                          )
                        ) : null}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        ) : null}
      </main>
    </TooltipProvider>
  );
}
