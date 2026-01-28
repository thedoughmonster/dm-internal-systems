import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";
import { extractSignature } from "./signature_extractors.ts";
import { ingestSyscoPurchaseHistoryV1 } from "./ingestion_handlers/sysco_purchase_history_v1.ts";
import { ingestSyscoInvoiceV1 } from "./ingestion_handlers/sysco_invoice_v1.ts";

export type HandlerArgs = {
  supabaseUrl: string;
  serviceRoleKey: string;
  csvText: string;
  filename: string | null;
};

export type HandlerResult = { summary: object };
export type Handler = (args: HandlerArgs) => Promise<HandlerResult>;

const HANDLERS: Record<string, Handler> = {
  sysco_purchase_history_v1: async (args) => {
    const supabaseClient = createClient(args.supabaseUrl, args.serviceRoleKey);
    const extractedSignature = extractSignature(args.csvText);
    const result = await ingestSyscoPurchaseHistoryV1({
      csvText: args.csvText,
      extractedSignature,
      supabaseClient,
    });
    return { summary: result };
  },
  sysco_invoice_v1: async (args) => {
    const supabaseClient = createClient(args.supabaseUrl, args.serviceRoleKey);
    const extractedSignature = extractSignature(args.csvText);
    const result = await ingestSyscoInvoiceV1({
      supabase: supabaseClient,
      vendorKey: "sysco",
      csvText: args.csvText,
      extracted: extractedSignature,
    });
    return { summary: result };
  },
};

export async function dispatchToHandler(id: string, args: HandlerArgs): Promise<HandlerResult> {
  const handler = HANDLERS[id];
  if (!handler) {
    throw new Error("HANDLER_NOT_FOUND");
  }
  return handler(args);
}
