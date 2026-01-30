import type {
  AnalyzeRequestPayload,
  AnalyzeResponsePayload,
  ConfirmRequestPayload,
  ConfirmResponsePayload,
} from "./types";

const FUNCTIONS_URL = process.env.NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL;
const SUPABASE_ANON_KEY = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const INTERNAL_UI_SHARED_SECRET =
  process.env.NEXT_PUBLIC_INTERNAL_UI_SHARED_SECRET;

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

function getIngestEndpoint() {
  if (!FUNCTIONS_URL) {
    throw new Error("Missing NEXT_PUBLIC_SUPABASE_FUNCTIONS_URL");
  }

  return `${FUNCTIONS_URL.replace(/\/$/, "")}/vendor_ingest`;
}

async function postIngest<TResponse>(body: Record<string, unknown>) {
  const response = await fetch(getIngestEndpoint(), {
    method: "POST",
    headers: buildHeaders(),
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(`vendor_ingest failed with ${response.status}`);
  }

  return (await response.json()) as TResponse;
}

export async function analyzeVendorIngest(
  payload: AnalyzeRequestPayload,
): Promise<AnalyzeResponsePayload> {
  return postIngest<AnalyzeResponsePayload>(payload);
}

export async function confirmVendorIngest(
  payload: ConfirmRequestPayload,
): Promise<ConfirmResponsePayload> {
  return postIngest<ConfirmResponsePayload>(payload);
}
