import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import { htmlPage } from "./html.ts";
import { ArrivalEvent } from "./types.ts";
import { getOrderEnrichment } from "./enrichment.ts";
import { sendSlackCheckin } from "./slack.ts";

const corsHeaders = {
  "access-control-allow-origin": "*",
  "access-control-allow-methods": "GET,POST,OPTIONS",
  "access-control-allow-headers": "content-type",
};

serve(async (req) => {
  const url = new URL(req.url);

  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 204,
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
        headers: corsHeaders,
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

    console.log("[Info] arrival event", event);

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
    headers: corsHeaders,
  });
});
