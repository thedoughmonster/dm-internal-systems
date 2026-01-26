import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { htmlPage } from "./html.ts";
import { ArrivalEvent } from "./types.ts";
import { getOrderEnrichment } from "./enrichment.ts";
import { sendSlackCheckin } from "./slack.ts";

const allowedOrigins = new Set(["http://localhost:3000"]);

const getCorsHeaders = (req: Request) => {
  const origin = req.headers.get("origin") ?? "";
  return {
    "access-control-allow-origin": allowedOrigins.has(origin) ? origin : "null",
    "access-control-allow-methods": "GET,POST,OPTIONS",
    "access-control-allow-headers":
      "authorization, x-client-info, apikey, content-type",
    vary: "Origin",
  };
};

serve(async (req) => {
  const url = new URL(req.url);
  const corsHeaders = getCorsHeaders(req);

  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  // --------------------------------------------------
  // Serve CSS
  // --------------------------------------------------
  if (req.method === "GET" && url.pathname.endsWith("/styles.css")) {
    const css = await Deno.readTextFile("./styles.css");
    return new Response(css, {
      status: 200,
      headers: {
        ...corsHeaders,
        "content-type": "text/css; charset=utf-8",
      },
    });
  }

  // --------------------------------------------------
  // Serve HTML
  // --------------------------------------------------
  if (
    req.method === "GET" &&
    (url.pathname.endsWith("/toast_checkin") ||
      url.pathname.endsWith("/toast_checkin/"))
  ) {
    return new Response(htmlPage(url.searchParams), {
      status: 200,
      headers: {
        ...corsHeaders,
        "content-type": "text/html; charset=utf-8",
      },
    });
  }

  // --------------------------------------------------
  // Handle POST check-in
  // --------------------------------------------------
  if (req.method === "POST") {
    const checkinToken = url.searchParams.get("checkin");
    if (!checkinToken) {
      return new Response("Missing checkin token", {
        status: 400,
        headers: {
          ...corsHeaders,
          "content-type": "text/plain; charset=utf-8",
        },
      });
    }

    let body: any = {};
    try {
      body = await req.json();
    } catch {}

    const event: ArrivalEvent = {
      eventType: "curbside.arrived",
      occurredAt: new Date().toISOString(),
      checkinToken,
      request: {
        ip:
          req.headers.get("cf-connecting-ip") ??
          req.headers.get("x-forwarded-for") ??
          "unknown",
        userAgent: body?.userAgent,
      },
    };

    console.info(event);

    const enrichment = getOrderEnrichment(checkinToken);
    console.log("[Info] arrival enrichment", enrichment ?? "none");

    await sendSlackCheckin(event, enrichment);

    return new Response(JSON.stringify({ ok: true }), {
      status: 200,
      headers: {
        ...corsHeaders,
        "content-type": "application/json",
      },
    });
  }

  return new Response("Method not allowed", {
    status: 405,
    headers: {
      ...corsHeaders,
      "content-type": "text/plain; charset=utf-8",
    },
  });
});
