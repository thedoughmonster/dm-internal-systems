import "jsr:@supabase/functions-js/edge-runtime.d.ts";

Deno.serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "GET") {
    const challenge = url.searchParams.get("challenge");
    return new Response(
      JSON.stringify({ ok: true, challenge }),
      { headers: { "content-type": "application/json" } }
    );
  }

  const rawBody = await req.text();

  let json: unknown = null;
  try {
    json = rawBody ? JSON.parse(rawBody) : null;
  } catch {}

  const headers: Record<string, string> = {};
  for (const [k, v] of req.headers.entries()) headers[k] = v;

  return new Response(
    JSON.stringify(
      {
        ok: true,
        receivedAt: new Date().toISOString(),
        method: req.method,
        path: url.pathname,
        headers,
        rawBody,
        json,
      },
      null,
      2
    ),
    { headers: { "content-type": "application/json" } }
  );
});
