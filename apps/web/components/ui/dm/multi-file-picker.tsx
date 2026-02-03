import type { ComponentIdProps } from "@/lib/types/component-id"
"use client";

import * as React from "react";
import { FileText, Upload, X } from "lucide-react";

import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import type { DmPickedFileText } from "@/components/ui/dm/file-picker";

export type DmMultiFilePickerStatus = "idle" | "reading" | "ready" | "error";

export interface DmMultiFilePickerProps extends ComponentIdProps {
  accept?: string;
  disabled?: boolean;
  maxSizeBytes?: number;

  label?: string;
  helpText?: string;

  onPickText: (picked: DmPickedFileText[]) => void | Promise<void>;
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

export function DmMultiFilePicker(props: DmMultiFilePickerProps) {
  const {
    id,
    accept = ".csv,text/csv",
    disabled = false,
    maxSizeBytes,
    label = "Select files",
    helpText = "Choose vendor CSV exports. The system reads each file as text and hands them to the caller.",
    onPickText,
    onClear,
    className,
  } = props;

  const inputRef = React.useRef<HTMLInputElement | null>(null);

  const [status, setStatus] = React.useState<DmMultiFilePickerStatus>("idle");
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);
  const [meta, setMeta] = React.useState<
    Array<{
      filename: string;
      contentType: string;
      sizeBytes: number;
      lastModifiedMs: number;
    }>
  >([]);

  const canClear = status === "ready" || status === "error";

  const clear = React.useCallback(() => {
    setStatus("idle");
    setErrorMsg(null);
    setMeta([]);
    if (inputRef.current) inputRef.current.value = "";
    if (onClear) onClear();
  }, [onClear]);

  const openDialog = React.useCallback(() => {
    if (disabled) return;
    if (inputRef.current) inputRef.current.click();
  }, [disabled]);

  const readFiles = React.useCallback(
    async (files: FileList) => {
      setStatus("reading");
      setErrorMsg(null);

      try {
        const picked: DmPickedFileText[] = [];

        for (const file of Array.from(files)) {
          const filename = file.name || "unnamed";
          const contentType = file.type || "text/plain";
          const sizeBytes = file.size ?? 0;
          const lastModifiedMs = file.lastModified ?? 0;

          if (maxSizeBytes !== undefined && sizeBytes > maxSizeBytes) {
            throw new Error(
              `File ${filename} is too large. Max is ${formatBytes(maxSizeBytes)} but got ${formatBytes(
                sizeBytes,
              )}.`,
            );
          }

          const text = await file.text();
          picked.push({
            file,
            filename,
            contentType,
            sizeBytes,
            lastModifiedMs,
            text,
          });
        }

        setMeta(
          picked.map((file) => ({
            filename: file.filename,
            contentType: file.contentType,
            sizeBytes: file.sizeBytes,
            lastModifiedMs: file.lastModifiedMs,
          })),
        );
        setStatus("ready");
        await onPickText(picked);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to read files";
        setStatus("error");
        setErrorMsg(message);
        setMeta([]);
      }
    },
    [maxSizeBytes, onPickText],
  );

  const onInputChange = React.useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const files = e.target.files;
      if (!files || files.length === 0) return;
      void readFiles(files);
    },
    [readFiles],
  );

  return (
    <div id={id} className={cn("grid gap-3", className)}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0">
          <div className="text-sm font-medium">{label}</div>
          <div className="mt-1 text-xs text-muted-foreground">{helpText}</div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <Button
            id={`${id}-pick`}
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
            {status === "reading" ? "Reading" : "Choose files"}
          </Button>

          <Button
            id={`${id}-clear`}
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
        id={`${id}-input`}
        ref={inputRef}
        type="file"
        accept={accept}
        multiple
        disabled={disabled}
        onChange={onInputChange}
        className="hidden"
      />

      {meta.length > 0 ? (
        <div className="rounded-2xl border border-border/60 bg-muted/20 p-3">
          <div className="flex flex-wrap items-center gap-2">
            <Badge id={`${id}-meta-count`} variant="outline">
              {meta.length} files
            </Badge>
          </div>
          <div className="mt-2 grid gap-2 text-xs">
            {meta.map((file, index) => (
              <div
                key={`${file.filename}-${file.lastModifiedMs}`}
                className="flex flex-wrap gap-2"
              >
                <Badge
                  id={`${id}-meta-${index}-name`}
                  variant="outline"
                  className="gap-2"
                >
                  <FileText className="h-3.5 w-3.5" />
                  {file.filename}
                </Badge>
                <Badge id={`${id}-meta-${index}-size`} variant="outline">
                  {formatBytes(file.sizeBytes)}
                </Badge>
                <Badge id={`${id}-meta-${index}-type`} variant="outline">
                  {file.contentType || "unknown"}
                </Badge>
              </div>
            ))}
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
