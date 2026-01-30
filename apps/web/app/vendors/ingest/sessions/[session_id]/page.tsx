import SessionDetails from "./SessionDetails";

type SessionRecord = {
  id: string;
  created_at: string;
  vendor_id: string;
  handler_id: string;
  filename: string | null;
  proposed: object;
  confirm_meta: object;
  write_summary: object;
  audit: object;
  vendor_invoice_id: string | null;
};

async function fetchSession(
  supabaseUrl: string,
  supabaseAnonKey: string,
  sessionId: string,
): Promise<SessionRecord | null> {
  const endpoint = `${supabaseUrl.replace(/\/$/, "")}/rest/v1/vendor_ingest_sessions` +
    `?id=eq.${encodeURIComponent(sessionId)}&select=*`;
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
      `Failed to load session with ${response.status}: ${text}`,
    );
  }

  const rows = (await response.json()) as SessionRecord[];
  return rows.length > 0 ? rows[0] : null;
}

export default async function VendorsIngestSessionPage({
  params,
}: {
  params: { session_id: string };
}) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    const missing = [
      !supabaseUrl ? "NEXT_PUBLIC_SUPABASE_URL" : null,
      !supabaseAnonKey ? "NEXT_PUBLIC_SUPABASE_ANON_KEY" : null,
    ].filter(Boolean);
    return (
      <div className="p-6">
        <p className="text-sm text-slate-700">
          Missing env var: {missing.join(", ")}
        </p>
      </div>
    );
  }

  let session: SessionRecord | null = null;
  let errorMessage: string | null = null;
  try {
    session = await fetchSession(
      supabaseUrl,
      supabaseAnonKey,
      params.session_id,
    );
  } catch (error) {
    errorMessage = error instanceof Error ? error.message : "Unknown error";
  }

  if (errorMessage) {
    return (
      <div className="p-6">
        <p className="text-sm text-rose-600">{errorMessage}</p>
      </div>
    );
  }

  if (!session) {
    return (
      <div className="p-6">
        <p className="text-sm text-slate-600">Session not found.</p>
      </div>
    );
  }

  return <SessionDetails session={session} />;
}
