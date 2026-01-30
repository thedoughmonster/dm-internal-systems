// apps/web/app/vendors/ingest/sessions/[session_id]/page.tsx
import SessionDetails from "./SessionDetails";

type SessionRecord = {
  id: string;
  created_at: string;
  vendor_id: string;
  handler_id: string;
  filename: string | null;
  proposed: unknown;
  confirm_meta: unknown;
  write_summary: unknown;
  audit: unknown;
  vendor_invoice_id: string | null;
};

function isUuid(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
    value,
  );
}

async function fetchSession(
  supabaseUrl: string,
  supabaseAnonKey: string,
  sessionId: string,
): Promise<SessionRecord | null> {
  const endpoint =
    `${supabaseUrl.replace(/\/$/, "")}/rest/v1/vendor_ingest_sessions` +
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
    throw new Error(`Failed to load session with ${response.status}: ${text}`);
  }

  const rows = (await response.json()) as SessionRecord[];
  return rows.length > 0 ? rows[0] : null;
}

async function resolveParams(
  params: unknown,
): Promise<{ session_id?: string } | null> {
  if (!params) return null;
  // Next may provide params as a Promise in some configurations.
  const resolved = await Promise.resolve(params as any);
  return resolved && typeof resolved === "object" ? (resolved as any) : null;
}

export default async function VendorsIngestSessionPage(props: {
  params?: unknown;
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

  const resolvedParams = await resolveParams(props.params);
  const sessionId =
    resolvedParams && typeof resolvedParams.session_id === "string"
      ? resolvedParams.session_id
      : null;

  if (!sessionId) {
    return (
      <div className="p-6">
        <p className="text-sm text-rose-600">
          Missing session id in route params.
        </p>
      </div>
    );
  }

  if (!isUuid(sessionId)) {
    return (
      <div className="p-6">
        <p className="text-sm text-rose-600">Invalid session id: {sessionId}</p>
      </div>
    );
  }

  let session: SessionRecord | null = null;
  let errorMessage: string | null = null;

  try {
    session = await fetchSession(supabaseUrl, supabaseAnonKey, sessionId);
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
