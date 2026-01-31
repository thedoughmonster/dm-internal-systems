import Link from "next/link";

type SessionRow = {
  id: string;
  created_at: string;
  handler_id: string;
  filename: string | null;
  proposed: {
    vendorKey?: string | null;
    documentType?: string | null;
    formatVersion?: number | null;
  } | null;
  vendor_invoice_id: string | null;
};

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
      <div className="p-6">
        <p className="text-sm text-slate-700">
          Missing env var: {missing.join(", ")}
        </p>
      </div>
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
    <div className="p-6">
      <h1 className="text-xl font-semibold text-slate-900">
        Vendor Ingest Sessions
      </h1>
      {errorMessage ? (
        <p className="mt-4 text-sm text-rose-600">{errorMessage}</p>
      ) : sessions.length === 0 ? (
        <p className="mt-4 text-sm text-slate-600">No sessions yet.</p>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm text-slate-700">
            <thead className="border-b border-slate-200 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-3 py-2">Created</th>
                <th className="px-3 py-2">Handler</th>
                <th className="px-3 py-2">Filename</th>
                <th className="px-3 py-2">Vendor Key</th>
                <th className="px-3 py-2">Document Type</th>
                <th className="px-3 py-2">Format Version</th>
                {showPackIntent ? (
                  <th className="px-3 py-2">Pack Verification</th>
                ) : null}
              </tr>
            </thead>
            <tbody>
              {sessions.map((session) => (
                <tr key={session.id} className="border-b border-slate-100">
                  <td className="px-3 py-2">
                    <Link
                      className="text-blue-600 hover:text-blue-800"
                      href={`/vendors/ingest/sessions/${session.id}`}
                    >
                      {session.created_at}
                    </Link>
                  </td>
                  <td className="px-3 py-2">{session.handler_id}</td>
                  <td className="px-3 py-2">{session.filename ?? "n/a"}</td>
                  <td className="px-3 py-2">
                    {session.proposed?.vendorKey ?? "n/a"}
                  </td>
                  <td className="px-3 py-2">
                    {session.proposed?.documentType ?? "n/a"}
                  </td>
                  <td className="px-3 py-2">
                    {session.proposed?.formatVersion ?? "n/a"}
                  </td>
                  {showPackIntent ? (
                    <td className="px-3 py-2">
                      <Link
                        className="inline-flex rounded-md bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-slate-800"
                        href={`/vendor-ingest/session/${session.id}/pack-verification`}
                      >
                        Pack verification
                      </Link>
                    </td>
                  ) : null}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
