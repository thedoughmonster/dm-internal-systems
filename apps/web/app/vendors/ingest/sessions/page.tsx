import VendorsIngestSessionsView, {
  type SessionRow,
} from "./composites/VendorIngestSessionsView";

async function fetchSessions(
  supabaseUrl: string,
  supabaseAnonKey: string,
): Promise<SessionRow[]> {
  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/vendor_ingest_sessions` +
    "?select=id,created_at,handler_id,filename,proposed,vendor_invoice_id" +
    "&order=created_at.desc&limit=50";
  const response = await fetch(endpoint, {
    headers: {
      apikey: supabaseAnonKey,
      Authorization: `Bearer ${supabaseAnonKey}`,
    },
    cache: "no-store",
  });

  if (!response.ok) {
    const text = await response.text();
    throw new Error(
      `Failed to load sessions with ${response.status}: ${text}`,
    );
  }

  return (await response.json()) as SessionRow[];
}

export default async function VendorsIngestSessionsPage({
  searchParams,
}: {
  searchParams?: Promise<{ intent?: string }>;
}) {
  const sp = searchParams ? await searchParams : undefined;

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const showPackIntent = sp?.intent === "pack";

  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = [
      !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !supabaseAnonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
    ].filter(Boolean);
    return (
      <VendorsIngestSessionsView
        sessions={[]}
        errorMessage={`Missing env var: ${missing.join(", ")}`}
        showPackIntent={showPackIntent}
      />
    );
  }

  let sessions: SessionRow[] = [];
  let errorMessage: string | null = null;
  try {
    sessions = await fetchSessions(supabaseUrl, supabaseAnonKey);
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";
  }

  return (
    <VendorsIngestSessionsView
      sessions={sessions}
      errorMessage={errorMessage}
      showPackIntent={showPackIntent}
    />
  );
}
