/* apps/web/components/ui/dm/file-picker.tsx */
"use client";

import * as React from "react";
import { FileText, Upload, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export type DmFilePickerStatus = "idle" | "reading" | "ready" | "error";

export interface DmPickedFileText {
  file: File;
  filename: string;
  contentType: string;
  sizeBytes: number;
  lastModifiedMs: number;
  text: string;
}

export interface DmFilePickerProps {
  accept?: string;
  disabled?: boolean;
  maxSizeBytes?: number;

  label?: string;
  helpText?: string;

  onPickText: (picked: DmPickedFileText) => void | Promise<void>;
  onClear?: () => void;

  className?: string;
}

function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes < 0) return "0 B";
  const units = ["B", "KB", "MB", "GB"];
  let idx = 0;
  let val = bytes;
  while (val >= 1024 && idx < units.length - 1) {
    val = val / 1024;
    idx++;
  }
  const rounded = idx === 0 ? String(Math.round(val)) : val.toFixed(2);
  return `${rounded} ${units[idx]}`;
}

export function DmFilePicker(props: DmFilePickerProps) {
  const {
    accept = ".csv,text/csv",
    disabled = false,
    maxSizeBytes,
    label = "Select a file",
    helpText = "Choose a CSV export. The system will read it as text and hand it to the caller.",
    onPickText,
    onClear,
    className,
  } = props;

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const [status, setStatus] = React.useState<DmFilePickerStatus>("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [meta, setMeta] = React.useState<{
    filename: string;
    contentType: string;
    sizeBytes: number;
    lastModifiedMs: number;
  } | null>(null);

  const canClear = status === "ready" || status === "error";

  const clear = React.useCallback(() => {
    setStatus("idle");
    setErrorMsg(null);
    setMeta(null);
    if (inputRef.current) inputRef.current.value = "";
    if (onClear) onClear();
  }, [onClear]);

  const openDialog = React.useCallback(() => {
    if (disabled) return;
    if (inputRef.current) inputRef.current.click();
  }, [disabled]);

  const readFile = React.useCallback(
    async (file: File) => {
      setStatus("reading");
      setErrorMsg(null);

      try {
        const filename = file.name || "unnamed";
        const contentType = file.type || "text/plain";
        const sizeBytes = file.size ?? 0;
        const lastModifiedMs = file.lastModified ?? 0;

        if (maxSizeBytes !== undefined && sizeBytes > maxSizeBytes) {
          throw new Error(
            `File is too large. Max is ${formatBytes(maxSizeBytes)} but got ${formatBytes(sizeBytes)}.`
          );
        }

        const text = await file.text();

        const picked: DmPickedFileText = {
          file,
          filename,
          contentType,
          sizeBytes,
          lastModifiedMs,
          text,
        };

        setMeta({ filename, contentType, sizeBytes, lastModifiedMs });
        setStatus("ready");
        await onPickText(picked);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to read file";
        setStatus("error");
        setErrorMsg(message);
        setMeta(null);
      }
    },
    [maxSizeBytes, onPickText]
  );

  const onInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
      if (!file) return;
      void readFile(file);
    },
    [readFile]
  );

  return (
    <div className={cn("grid gap-3", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          <div className="mt-1 text-xs text-muted-foreground">{helpText}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            className="gap-2"
            onClick={openDialog}
            disabled={disabled || status === "reading"}
          >
            {status === "reading" ? (
              <Upload className="h-4 w-4 animate-pulse" />
            ) : (
              <Upload className="h-4 w-4" />
            )}
            {status === "reading" ? "Reading" : "Choose file"}
          </Button>

          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={clear}
            disabled={disabled || !canClear}
          >
            <X className="h-4 w-4" />
            Clear
          </Button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={onInputChange}
        className="hidden"
      />

      {meta ? (
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge variant="outline" className="gap-2">
              <FileText className="h-3.5 w-3.5" />
              {meta.filename}
            </Badge>
            <Badge variant="outline">{formatBytes(meta.sizeBytes)}</Badge>
            <Badge variant="outline">{meta.contentType || "unknown"}</Badge>
          </div>
        </div>
      ) : null}

      {errorMsg ? (
        <div className="rounded-2xl border border-red-500/40 bg-red-500/10 p-3 text-sm text-red-100">
          <div className="font-medium">File error</div>
          <div className="mt-1 text-xs text-red-100/80">{errorMsg}</div>
        </div>
      ) : null}
    </div>
  );
}