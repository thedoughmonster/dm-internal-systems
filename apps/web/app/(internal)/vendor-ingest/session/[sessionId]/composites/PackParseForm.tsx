"use client";

import { useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

type PackParseFormProps = {
  vendorId: string;
  packStringRaw: string;
  packStringNormalized: string;
  evidence: Record<string, unknown>;
};

type PackParseResponse = {
  ok: boolean;
  parse?: Record<string, unknown>;
  error?: { code: string; message: string; details?: Record<string, unknown> };
};

const FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export default function PackParseForm({
  vendorId,
  packStringRaw,
  packStringNormalized,
  evidence,
}: PackParseFormProps) {
  const rawId = useId();
  const normalizedId = useId();
  const qtyId = useId();
  const qtyUomId = useId();
  const sizeId = useId();
  const sizeUomId = useId();
  const verifiedById = useId();
  const notesId = useId();
  const [packQty, setPackQty] = useState(0);
  const [packUom, setPackUom] = useState("");
  const [packSize, setPackSize] = useState(0);
  const [packSizeUom, setPackSizeUom] = useState("");
  const [verifiedBy, setVerifiedBy] = useState("");
  const [notes, setNotes] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

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

    setBusy(true);
    try {
      const response = await fetch(
        `${FUNCTIONS_URL.replace(/\/$/, "")}/vendor_pack_parse_upsert_v1`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
            apikey: SUPABASE_ANON_KEY,
          },
          body: JSON.stringify({
            vendorId,
            packStringRaw,
            packStringStructured: packStringNormalized,
            packQty,
            packUom,
            packSize,
            packSizeUom,
            verifiedBy: verifiedBy.trim() || null,
            notes: notes.trim(),
            evidence,
          }),
        },
      );

      const body = (await response.json()) as PackParseResponse;
      if (!response.ok || !body.ok) {
        throw new Error(body.error?.message || "Failed to save pack parse");
      }

      setStatus("Saved pack parse");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Unknown error";
      setError(message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor={rawId} className="text-xs text-slate-500">
          Raw pack string
        </Label>
        <Input id={rawId} value={packStringRaw} readOnly />
      </div>
      <div>
        <Label htmlFor={normalizedId} className="text-xs text-slate-500">
          Normalized pack string
        </Label>
        <Input id={normalizedId} value={packStringNormalized} readOnly />
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <div className="space-y-1">
          <Label htmlFor={qtyId} className="text-xs text-slate-500">
          Pack quantity
          </Label>
          <Input
            id={qtyId}
            type="number"
            step="0.01"
            value={Number.isFinite(packQty) ? packQty : 0}
            onChange={(event) => setPackQty(Number(event.target.value))}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={qtyUomId} className="text-xs text-slate-500">
          Pack UOM
          </Label>
          <Input
            id={qtyUomId}
            value={packUom}
            onChange={(event) => setPackUom(event.target.value)}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={sizeId} className="text-xs text-slate-500">
          Pack size
          </Label>
          <Input
            id={sizeId}
            type="number"
            step="0.01"
            value={Number.isFinite(packSize) ? packSize : 0}
            onChange={(event) => setPackSize(Number(event.target.value))}
            required
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor={sizeUomId} className="text-xs text-slate-500">
          Pack size UOM
          </Label>
          <Input
            id={sizeUomId}
            value={packSizeUom}
            onChange={(event) => setPackSizeUom(event.target.value)}
            required
          />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor={verifiedById} className="text-xs text-slate-500">
          Verified by
        </Label>
        <Input
          id={verifiedById}
          value={verifiedBy}
          onChange={(event) => setVerifiedBy(event.target.value)}
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor={notesId} className="text-xs text-slate-500">
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
          disabled={busy}
        >
          {busy ? "Saving" : "Save parse"}
        </Button>
        {status ? <span className="text-sm text-emerald-600">{status}</span> : null}
        {error ? <span className="text-sm text-rose-600">{error}</span> : null}
      </div>
    </form>
  );
}
