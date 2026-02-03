"use client";

import * as React from "react";
import { toast } from "sonner";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type PackMappingQueueRow = {
  vendor_id: string;
  vendor_key: string;
  pack_string_normalized: string;
  line_count: number;
  raw_samples: string[];
  vendor_invoice_id: string;
  vendor_invoice_number: string;
  invoice_date: string;
  vendor_sku: string | null;
  description: string | null;
  pack_string_raw: string;
};

export type PackParseUpsertRequest = {
  vendorId: string;
  packStringRaw: string;
  packQty: number;
  packSize: number;
  packSizeUom: string;
  evidence?: Record<string, unknown> | null;
};

type PackMappingRowFormProps = {
  row: PackMappingQueueRow;
  onSave: (payload: PackParseUpsertRequest) => Promise<void>;
  onFlagNotSupported: (payload: { vendorId: string; packStringRaw: string }) => Promise<void>;
  onSaved?: () => void;
};

type UnitCategoryKey = "weight" | "volume" | "quantity" | "time" | "length";
type UnitOption = { value: string; label: string };

const UNIT_CATEGORIES: Record<UnitCategoryKey, { label: string; units: UnitOption[] }> = {
  weight: {
    label: "Weight",
    units: [
      { value: "mg", label: "mg (milligram)" },
      { value: "g", label: "g (gram)" },
      { value: "kg", label: "kg (kilogram)" },
      { value: "oz", label: "oz (ounce)" },
      { value: "lb", label: "lb (pound)" },
      { value: "t", label: "t (ton)" },
    ],
  },
  volume: {
    label: "Volume",
    units: [
      { value: "ml", label: "ml (milliliter)" },
      { value: "dl", label: "dl (deciliter)" },
      { value: "l", label: "l (liter)" },
      { value: "kl", label: "kl (kiloliter)" },
      { value: "tsp", label: "tsp (teaspoon)" },
      { value: "tbsp", label: "tbsp (tablespoon)" },
      { value: "floz", label: "floz (fluid ounce)" },
      { value: "cup", label: "cup (cup)" },
      { value: "pt", label: "pt (pint)" },
      { value: "qt", label: "qt (quart)" },
      { value: "gal", label: "gal (gallon)" },
    ],
  },
  quantity: {
    label: "Quantity",
    units: [
      { value: "each", label: "each (each)" },
      { value: "dozen", label: "dozen (dozen)" },
      { value: "hundred", label: "hundred (hundred)" },
      { value: "thousand", label: "thousand (thousand)" },
      { value: "million", label: "million (million)" },
    ],
  },
  time: {
    label: "Time",
    units: [
      { value: "s", label: "s (second)" },
      { value: "min", label: "min (minute)" },
      { value: "hr", label: "hr (hour)" },
      { value: "day", label: "day (day)" },
    ],
  },
  length: {
    label: "Length",
    units: [
      { value: "mm", label: "mm (millimeter)" },
      { value: "cm", label: "cm (centimeter)" },
      { value: "m", label: "m (meter)" },
      { value: "km", label: "km (kilometer)" },
      { value: "in", label: "in (inch)" },
      { value: "ft", label: "ft (foot)" },
      { value: "yd", label: "yd (yard)" },
      { value: "mi", label: "mi (mile)" },
    ],
  },
};

function parseNumber(value: string): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return null;
  return parsed;
}

export default function PackMappingRowForm({
  row,
  onSave,
  onFlagNotSupported,
  onSaved,
}: PackMappingRowFormProps) {
  const formId = React.useMemo(
    () =>
      `pack-mapping-row-${row.vendor_id}-${row.pack_string_raw}`.replace(
        /[^a-z0-9]+/gi,
        "-",
      ),
    [row.pack_string_raw, row.vendor_id],
  );
  const [packQty, setPackQty] = React.useState("");
  const [packSize, setPackSize] = React.useState("");
  const [packSizeUom, setPackSizeUom] = React.useState("");
  const [unitCategory, setUnitCategory] = React.useState<UnitCategoryKey>("weight");
  const [unitValue, setUnitValue] = React.useState("");
  const [showOtherUnit, setShowOtherUnit] = React.useState(false);
  const [status, setStatus] = React.useState<"idle" | "saving" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const [successLabel, setSuccessLabel] = React.useState<"saved" | "flagged" | null>(null);
  const successTimeoutRef = React.useRef<number | null>(null);

  React.useEffect(() => {
    return () => {
      if (successTimeoutRef.current) {
        window.clearTimeout(successTimeoutRef.current);
      }
    };
  }, []);

  const clearSuccessTimeout = React.useCallback(() => {
    if (successTimeoutRef.current) {
      window.clearTimeout(successTimeoutRef.current);
      successTimeoutRef.current = null;
    }
  }, []);

  const scheduleSaved = React.useCallback(() => {
    if (!onSaved) return;
    clearSuccessTimeout();
    successTimeoutRef.current = window.setTimeout(() => {
      onSaved();
    }, 1200);
  }, [clearSuccessTimeout, onSaved]);

  const handleSubmit = React.useCallback(async () => {
    clearSuccessTimeout();
    setStatus("idle");
    setErrorMessage(null);
    setSuccessLabel(null);

    const packStringRaw = row.pack_string_raw ?? "";
    if (!packStringRaw.trim()) {
      setStatus("error");
      setErrorMessage("Pack string raw is missing.");
      return;
    }

    const parsedPackQty = parseNumber(packQty);
    if (parsedPackQty === null || parsedPackQty <= 0) {
      setStatus("error");
      setErrorMessage("Pack quantity must be a positive number.");
      return;
    }

    const parsedPackSize = parseNumber(packSize);
    if (parsedPackSize === null || parsedPackSize <= 0) {
      setStatus("error");
      setErrorMessage("Pack size must be a positive number.");
      return;
    }

    if (!packSizeUom.trim()) {
      setStatus("error");
      setErrorMessage("UOM is required.");
      return;
    }

    setStatus("saving");

    try {
      await onSave({
        vendorId: row.vendor_id,
        packStringRaw,
        packQty: parsedPackQty,
        packSize: parsedPackSize,
        packSizeUom: packSizeUom.trim(),
        evidence: {
          vendorKey: row.vendor_key,
          vendorInvoiceId: row.vendor_invoice_id,
          vendorInvoiceNumber: row.vendor_invoice_number,
          invoiceDate: row.invoice_date,
          vendorSku: row.vendor_sku,
          description: row.description,
          packStringRaw: row.pack_string_raw,
          rawSamples: row.raw_samples,
          queueLineCount: row.line_count,
        },
      });
      setStatus("success");
      setSuccessLabel("saved");
      toast("Saved mapping");
      scheduleSaved();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to save mapping.";
      setStatus("error");
      setErrorMessage(message);
    }
  }, [
    onSave,
    packQty,
    packSize,
    packSizeUom,
    row.description,
    row.invoice_date,
    row.line_count,
    row.pack_string_raw,
    row.raw_samples,
    row.vendor_id,
    row.vendor_invoice_id,
    row.vendor_invoice_number,
    row.vendor_key,
    row.vendor_sku,
    clearSuccessTimeout,
    scheduleSaved,
  ]);

  const handleFlagUnsupported = React.useCallback(async () => {
    clearSuccessTimeout();
    setStatus("idle");
    setErrorMessage(null);
    setSuccessLabel(null);

    const packStringRaw = row.pack_string_raw ?? "";
    if (!packStringRaw.trim()) {
      setStatus("error");
      setErrorMessage("Pack string raw is missing.");
      return;
    }

    setStatus("saving");
    try {
      await onFlagNotSupported({
        vendorId: row.vendor_id,
        packStringRaw,
      });
      setStatus("success");
      setSuccessLabel("flagged");
      toast("Flagged not supported");
      scheduleSaved();
    } catch (error) {
      const message = error instanceof Error ? error.message : "Failed to flag pack string.";
      setStatus("error");
      setErrorMessage(message);
    }
  }, [clearSuccessTimeout, onFlagNotSupported, row.pack_string_raw, row.vendor_id, scheduleSaved]);

  const unitOptions = React.useMemo(() => UNIT_CATEGORIES[unitCategory].units, [unitCategory]);

  return (
    <div className="grid gap-2">
      <div className="grid gap-2 md:grid-cols-4">
        <Input
          id={`${formId}-qty`}
          className="min-w-[9rem]"
          placeholder="Pack qty"
          value={packQty}
          onChange={(event) => setPackQty(event.target.value)}
          disabled={status === "saving"}
        />
        <Input
          id={`${formId}-size`}
          className="min-w-[9rem]"
          placeholder="Pack size"
          value={packSize}
          onChange={(event) => setPackSize(event.target.value)}
          disabled={status === "saving"}
        />
        <Select
          id={`${formId}-unit-category`}
          value={unitCategory}
          onValueChange={(value) => {
            const nextCategory = value as UnitCategoryKey;
            setUnitCategory(nextCategory);
            setUnitValue("");
            setShowOtherUnit(false);
            setPackSizeUom("");
          }}
          disabled={status === "saving"}
        >
          <SelectTrigger id={`${formId}-unit-category-trigger`} className="min-w-[9rem]">
            <SelectValue id={`${formId}-unit-category-value`} placeholder="Unit type" />
          </SelectTrigger>
          <SelectContent id={`${formId}-unit-category-content`}>
            {Object.entries(UNIT_CATEGORIES).map(([key, category]) => (
              <SelectItem id={`${formId}-unit-category-${key}`} key={key} value={key}>
                {category.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select
          id={`${formId}-unit`}
          value={unitValue}
          onValueChange={(value) => {
            if (value === "other") {
              setUnitValue(value);
              setShowOtherUnit(true);
              setPackSizeUom("");
              return;
            }
            setUnitValue(value);
            setShowOtherUnit(false);
            setPackSizeUom(value);
          }}
          disabled={status === "saving"}
        >
          <SelectTrigger id={`${formId}-unit-trigger`} className="min-w-[9rem]">
            <SelectValue id={`${formId}-unit-value`} placeholder="Unit" />
          </SelectTrigger>
          <SelectContent id={`${formId}-unit-content`}>
            {unitOptions.map((unit) => (
              <SelectItem
                id={`${formId}-unit-${unit.value}`}
                key={unit.value}
                value={unit.value}
              >
                {unit.label}
              </SelectItem>
            ))}
            <SelectItem id={`${formId}-unit-other`} value="other">
              Other
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {showOtherUnit ? (
        <Input
          id={`${formId}-unit-custom`}
          className="min-w-[9rem]"
          placeholder="Custom unit"
          value={packSizeUom}
          onChange={(event) => setPackSizeUom(event.target.value)}
          disabled={status === "saving"}
        />
      ) : null}

      <div className="flex flex-wrap items-center gap-2">
        <Button
          id={`${formId}-save`}
          size="sm"
          onClick={handleSubmit}
          disabled={status === "saving"}
        >
          {status === "saving" ? "Saving..." : "Save mapping"}
        </Button>
        <Button
          id={`${formId}-flag`}
          size="sm"
          variant="secondary"
          onClick={handleFlagUnsupported}
          disabled={status === "saving"}
        >
          Flag not supported
        </Button>
        {status === "success" ? (
          <span className="text-xs text-emerald-500">
            {successLabel === "flagged" ? "Flagged" : "Saved"}
          </span>
        ) : null}
      </div>

      {status === "error" && errorMessage ? (
        <Alert id={`${formId}-error`} className="border-red-500/40 bg-red-500/10">
          <AlertTitle id={`${formId}-error-title`} className="text-red-100">
            Mapping error
          </AlertTitle>
          <AlertDescription id={`${formId}-error-description`} className="text-red-100/80">
            {errorMessage}
          </AlertDescription>
        </Alert>
      ) : null}
    </div>
  );
}
