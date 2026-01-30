// apps/web/app/vendors/ingest/components/FilePicker.tsx
// UI only component for selecting a single file and reading it as text.
// This component does not call any APIs and does not infer vendor or format.

"use client";

import React, { useCallback, useMemo, useRef, useState } from "react";
import { analyzeVendorIngest } from "../lib/api";
import type { AnalyzeResponsePayload } from "../lib/types";

export type FilePickerStatus = "idle" | "reading" | "ready" | "error";

export interface PickedFileText {
  file: File;
  filename: string;
  content_type: string;
  size_bytes: number;
  last_modified_ms: number;
  content: string;
}

export interface FilePickerProps {
  accept?: string;
  disabled?: boolean;
  maxSizeBytes?: number;
  label?: string;
  helperText?: string;

  onPicked: (picked: PickedFileText) => void;
  onCleared?: () => void;
  onError?: (error: { message: string; details?: unknown }) => void;
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

export default function FilePicker(props: FilePickerProps) {
  const {
    accept = ".csv,text/csv",
    disabled = false,
    maxSizeBytes,
    label = "Select a file",
    helperText = "Choose a CSV export. The system will analyze it on the server.",
    onPicked,
    onCleared,
    onError,
  } = props;

  const inputRef = useRef<HTMLInputElement | null>(null);

  const [status, setStatus] = useState<FilePickerStatus>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [pickedMeta, setPickedMeta] = useState<{
    filename: string;
    content_type: string;
    size_bytes: number;
    last_modified_ms: number;
  } | null>(null);

  const canClear = useMemo(() => status === "ready" || status === "error", [status]);

  const clear = useCallback(() => {
    setStatus("idle");
    setErrorMsg(null);
    setPickedMeta(null);
    if (inputRef.current) inputRef.current.value = "";
    if (onCleared) onCleared();
  }, [onCleared]);

  const readFile = useCallback(
    async (file: File) => {
      setStatus("reading");
      setErrorMsg(null);

      try {
        const filename = file.name || "unnamed";
        const content_type = file.type || "text/plain";
        const size_bytes = file.size ?? 0;
        const last_modified_ms = file.lastModified ?? 0;

        if (maxSizeBytes !== undefined && size_bytes > maxSizeBytes) {
          throw new Error(
            `File is too large. Max allowed is ${formatBytes(maxSizeBytes)} but got ${formatBytes(size_bytes)}.`
          );
        }

        const content = await file.text();

        const picked: PickedFileText = {
          file,
          filename,
          content_type,
          size_bytes,
          last_modified_ms,
          content,
        };

        setPickedMeta({ filename, content_type, size_bytes, last_modified_ms });
        setStatus("ready");
        onPicked(picked);
      } catch (err) {
        const message = err instanceof Error ? err.message : "Failed to read file";
        setStatus("error");
        setErrorMsg(message);
        setPickedMeta(null);
        if (onError) onError({ message, details: err });
      }
    },
    [maxSizeBytes, onPicked, onError]
  );

  const onInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files && e.target.files[0] ? e.target.files[0] : null;
      if (!file) return;
      void readFile(file);
    },
    [readFile]
  );

  const openFileDialog = useCallback(() => {
    if (disabled) return;
    if (inputRef.current) inputRef.current.click();
  }, [disabled]);

  return (
    <div style={{ display: "grid", gap: 8 }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12 }}>
        <div style={{ display: "grid", gap: 2 }}>
          <div style={{ fontWeight: 600 }}>{label}</div>
          <div style={{ fontSize: 12, opacity: 0.8 }}>{helperText}</div>
        </div>

        <div style={{ display: "flex", gap: 8 }}>
          <button type="button" onClick={openFileDialog} disabled={disabled || status === "reading"}>
            {status === "reading" ? "Reading..." : "Choose file"}
          </button>
          <button type="button" onClick={clear} disabled={disabled || !canClear}>
            Clear
          </button>
        </div>
      </div>

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        disabled={disabled}
        onChange={onInputChange}
        style={{ display: "none" }}
      />

      {pickedMeta ? (
        <div style={{ fontSize: 12, opacity: 0.9 }}>
          <div>
            <strong>File:</strong> {pickedMeta.filename}
          </div>
          <div>
            <strong>Type:</strong> {pickedMeta.content_type || "unknown"}
          </div>
          <div>
            <strong>Size:</strong> {formatBytes(pickedMeta.size_bytes)}
          </div>
        </div>
      ) : null}

      {errorMsg ? (
        <div style={{ fontSize: 12 }}>
          <strong>Error:</strong> {errorMsg}
        </div>
      ) : null}
    </div>
  );
}

export function VendorIngestAnalyzePicker(): React.ReactElement {
  const [selectedFile, setSelectedFile] = useState<PickedFileText | null>(null);
  const [result, setResult] = useState<AnalyzeResponsePayload | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handlePicked = useCallback(async (picked: PickedFileText) => {
    setSelectedFile(picked);
    setResult(null);
    setError(null);
    setIsLoading(true);

    try {
      const payload = {
        csv: picked.content,
        filename: picked.filename,
      };
      const response = await analyzeVendorIngest(payload);
      setResult(response);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Analyze failed";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleCleared = useCallback(() => {
    setSelectedFile(null);
    setResult(null);
    setError(null);
    setIsLoading(false);
  }, []);

  const proposed = result?.proposed;

  return (
    <div>
      <FilePicker onPicked={handlePicked} onCleared={handleCleared} />

      {selectedFile ? (
        <div>
          <h3>Selected file</h3>
          <div>Name: {selectedFile.filename}</div>
          <div>Size: {selectedFile.size_bytes}</div>
          <div>Type: {selectedFile.content_type || "unknown"}</div>
          <div>
            Last modified:{" "}
            {new Date(selectedFile.last_modified_ms).toISOString()}
          </div>
        </div>
      ) : null}

      {isLoading ? <div>Analyzing...</div> : null}

      {error ? (
        <div>
          <strong>Error:</strong> {error}
        </div>
      ) : null}

      {result ? (
        <div>
          <h3>Analyze result</h3>
          <div>status: {result.status}</div>
          <div>mode: {result.mode}</div>
          <div>proposed.id: {proposed?.id ?? "none"}</div>
          <div>proposed.vendorKey: {proposed?.vendorKey ?? "none"}</div>
          <div>proposed.documentType: {proposed?.documentType ?? "none"}</div>
          <div>proposed.formatVersion: {proposed?.formatVersion ?? "none"}</div>
          <div>proposed.confidence: {proposed?.confidence ?? "none"}</div>
          <div>ambiguity: {result.ambiguity ? "present" : "none"}</div>
          <div>results: {result.results.length}</div>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      ) : null}
    </div>
  );
}
