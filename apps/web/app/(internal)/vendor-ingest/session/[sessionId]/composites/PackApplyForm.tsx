"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

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

type CatalogOption = {
  id: string;
  label: string;
};

type PackApplyFormProps = {
  vendorId: string;
  packStringRaw: string;
  packStringNormalized: string;
  parse: PackParse;
  catalogOptions: CatalogOption[];
  evidence: Record<string, unknown>;
};

type PackApplyResponse = {
  ok: boolean;
  catalogItem?: Record<string, unknown>;
  error?: { code: string; message: string; details?: Record<string, unknown> };
};

const FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function PackApplyForm({
  vendorId,
  packStringRaw,
  packStringNormalized,
  parse,
  catalogOptions,
  evidence,
}: PackApplyFormProps) {
  const catalogId = useId();
  const applyModeId = useId();
  const notesId = useId();
  const [catalogItemId, setCatalogItemId] = useState(
    catalogOptions[0]?.id ?? "",
  );
  const [applyMode, setApplyMode] = useState<"REPLACE_ALWAYS" | "ONLY_IF_NULL">(
    "ONLY_IF_NULL",
  );
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const hasCatalogOptions = catalogOptions.length > 0;

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError(null);
    setStatus(null);

    if (!FUNCTIONS_URL || !SUPABASE_ANON_KEY) {
      setError("Missing NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
      return;
    }

    if (!notes.trim()) {
      setError("Notes are required");
      return;
    }

    if (!catalogItemId) {
      setError("Select a catalog item");
      return;
    }

    setBusy(true);
    try {
      const response = await fetch(
        `${FUNCTIONS_URL.replace(/\/$/, "")}/vendor_pack_parse_apply_to_catalog_item_v1`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            vendorId,
            catalogItemId,
            packStringRaw,
            packStringNormalized,
            applyMode,
            notes: notes.trim(),
            evidence,
          }),
        },
      );

      const body = (await response.json()) as PackApplyResponse;
      if (!response.ok || !body.ok) {
        throw new Error(body.error?.message || "Failed to apply pack parse");
      }

      setStatus("Applied to catalog item");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-2 text-sm">
        <div>
          <span className="text-xs text-muted-foreground">Normalized</span>
          <div className="font-mono text-xs text-foreground/90">{packStringNormalized}</div>
        </div>
        <div className="text-xs text-muted-foreground">
          Raw sample: {packStringRaw}
        </div>
        <div className="text-xs text-muted-foreground">
          Parsed: {parse.pack_qty} {parse.pack_uom} | {parse.pack_size} {parse.pack_size_uom}
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={catalogId} className="text-xs text-muted-foreground">
          Catalog item
        </Label>
        <Select
          value={catalogItemId}
          onValueChange={setCatalogItemId}
          disabled={!hasCatalogOptions}
        >
          <SelectTrigger id={catalogId}>
            <SelectValue
              placeholder={
                hasCatalogOptions
                  ? "Select a catalog item"
                  : "No catalog items from invoice lines"
              }
            />
          </SelectTrigger>
          <SelectContent>
            {hasCatalogOptions ? (
              catalogOptions.map((option) => (
                <SelectItem key={option.id} value={option.id}>
                  {option.label}
                </SelectItem>
              ))
            ) : (
              <SelectItem value="none" disabled>
                No catalog items available
              </SelectItem>
            )}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor={applyModeId} className="text-xs text-muted-foreground">
          Apply mode
        </Label>
        <Select
          value={applyMode}
          onValueChange={(value: "REPLACE_ALWAYS" | "ONLY_IF_NULL") =>
            setApplyMode(value)
          }
        >
          <SelectTrigger id={applyModeId}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="ONLY_IF_NULL">Only if null</SelectItem>
            <SelectItem value="REPLACE_ALWAYS">Replace always</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor={notesId} className="text-xs text-muted-foreground">
          Notes
        </Label>
        <Textarea
          id={notesId}
          rows={3}
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          required
        />
      </div>
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={busy || !hasCatalogOptions}
          className="min-w-[160px]"
        >
          {busy ? "Applying" : "Apply to catalog"}
        </Button>
        {status ? <span className="text-sm text-emerald-400">{status}</span> : null}
        {error ? <span className="text-sm text-destructive">{error}</span> : null}
      </div>
    </form>
  );
}
