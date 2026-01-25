import { serve } from "https://deno.land/std@0.224.0/http/server.ts";

type ToastWebhook = {
  timestamp?: string;
  eventCategory?: string;
  eventType?: string;
  guid?: string;
  details?: {
    restaurantGuid?: string;
    order?: {
      guid?: string;
      modifiedDate?: string;
      curbsidePickupInfo?: unknown;
    };
  };
};

let cachedToken: { token: string; obtainedAtMs: number } | null = null;
const TOKEN_TTL_MS = 20 * 60 * 1000; // 20 minutes

function env(name: string): string {
  const v = Deno.env.get(name);
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function ordersHeaders(token: string, restaurantGuid: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
    Accept: "application/json",
    "Restaurant-External-Id": restaurantGuid,
    "restaurant-external-id": restaurantGuid,
    "Toast-Restaurant-External-Id": restaurantGuid,
  };
}

async function toastLogin(): Promise<string> {
  const baseUrl = Deno.env.get("TOAST_BASE_URL") ?? "https://ws-api.toasttab.com";
  const clientId = env("TOAST_CLIENT_ID");
  const clientSecret = env("TOAST_CLIENT_SECRET");
  const userAccessType = Deno.env.get("TOAST_USER_ACCESS_TYPE") ?? "TOAST_MACHINE_CLIENT";

  if (cachedToken && Date.now() - cachedToken.obtainedAtMs < TOKEN_TTL_MS) {
    return cachedToken.token;
  }

  const url = `${baseUrl}/authentication/v1/authentication/login`;
  const resp = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ clientId, clientSecret, userAccessType }),
  });

  const text = await resp.text();
  if (!resp.ok) throw new Error(`Toast login failed: ${resp.status} ${text}`);

  const data = text ? JSON.parse(text) : null;

  const tokObj = data?.token;
  const token =
    (typeof tokObj === "string" && tokObj) ||
    (tokObj && typeof tokObj === "object" && (tokObj.accessToken || tokObj.token));

  if (!token) throw new Error(`Toast login succeeded but token missing: ${JSON.stringify(data)}`);

  cachedToken = { token, obtainedAtMs: Date.now() };
  return token;
}

async function toastGetOrder(orderGuid: string, restaurantGuid: string): Promise<any> {
  const baseUrl = Deno.env.get("TOAST_BASE_URL") ?? "https://ws-api.toasttab.com";
  const token = await toastLogin();

  const url = `${baseUrl}/orders/v2/orders/${orderGuid}`;
  const resp = await fetch(url, {
    method: "GET",
    headers: ordersHeaders(token, restaurantGuid),
  });

  const text = await resp.text();
  if (!resp.ok) throw new Error(`Toast get order failed: ${resp.status} ${text}`);

  return text ? JSON.parse(text) : null;
}

function curbsideProjection(order: any) {
  const check0 = Array.isArray(order?.checks) ? order.checks[0] : null;

  return {
    orderGuid: order?.guid,
    modifiedDate: order?.modifiedDate,
    businessDate: order?.businessDate,
    source: order?.source,
    approvalStatus: order?.approvalStatus,
    promisedDate: order?.promisedDate,
    deliveryInfo: order?.deliveryInfo ?? null,
    curbsidePickupInfo: order?.curbsidePickupInfo ?? null,
    tabName: check0?.tabName ?? null,
    checkGuid: check0?.guid ?? null,
    paymentStatus: check0?.paymentStatus ?? null,
  };
}

function deepClone<T>(obj: T): T {
  return obj ? JSON.parse(JSON.stringify(obj)) : obj;
}

function redactOrderForLogs(order: any) {
  const o = deepClone(order);

  if (Array.isArray(o?.checks)) {
    for (const c of o.checks) {
      if (c?.payments) c.payments = "[REDACTED_PAYMENTS]";
      if (c?.customer) c.customer = "[REDACTED_CUSTOMER]";
      if (c?.customerInfo) c.customerInfo = "[REDACTED_CUSTOMER_INFO]";
    }
  }

  if (o?.customer) o.customer = "[REDACTED_CUSTOMER]";

  return o;
}

function chunkString(s: string, chunkSize = 6000): string[] {
  const chunks: string[] = [];
  for (let i = 0; i < s.length; i += chunkSize) chunks.push(s.slice(i, i + chunkSize));
  return chunks;
}

serve(async (req) => {
  const ok = (extra: Record<string, unknown> = {}) =>
    new Response(JSON.stringify({ ok: true, ...extra }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  try {
    const url = new URL(req.url);
    const debug = url.searchParams.get("debug") === "1";

    const debugKey = Deno.env.get("DEBUG_KEY") ?? "";
    const provided = req.headers.get("x-debug-key") ?? "";

    // Debug mode: allow manual fetch by orderGuid and restaurantGuid
    if (debug) {
      if (!debugKey || provided !== debugKey) {
        return new Response(JSON.stringify({ ok: false, error: "unauthorized_debug" }), {
          status: 401,
          headers: { "Content-Type": "application/json" },
        });
      }

      const orderGuid = url.searchParams.get("orderGuid") ?? "";
      const restaurantGuid = url.searchParams.get("restaurantGuid") ?? "";

      if (!orderGuid || !restaurantGuid) {
        return new Response(
          JSON.stringify(
            {
              ok: false,
              error: "missing_debug_params",
              need: ["orderGuid", "restaurantGuid"],
              example:
                "?debug=1&orderGuid=<ORDER_GUID>&restaurantGuid=<RESTAURANT_GUID>",
            },
            null,
            2,
          ),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const fullOrder = await toastGetOrder(orderGuid, restaurantGuid);
      const fullOrderRedacted = redactOrderForLogs(fullOrder);

      return new Response(JSON.stringify(fullOrderRedacted, null, 2), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Normal webhook mode
    const raw = await req.text();

    let webhook: ToastWebhook;
    try {
      webhook = JSON.parse(raw);
    } catch {
      console.log("WEBHOOK BODY WAS NOT JSON");
      console.log(raw);
      return ok({ parsed: false });
    }

    const restaurantGuid = webhook?.details?.restaurantGuid ?? "";
    const orderGuid = webhook?.details?.order?.guid ?? "";

    console.log("TOAST WEBHOOK SUMMARY");
    console.log(
      JSON.stringify(
        {
          timestamp: webhook.timestamp,
          eventType: webhook.eventType,
          eventCategory: webhook.eventCategory,
          webhookEventGuid: webhook.guid,
          restaurantGuid,
          orderGuid,
          orderModifiedDate: webhook?.details?.order?.modifiedDate,
          curbsidePickupInfoWebhook: webhook?.details?.order?.curbsidePickupInfo,
        },
        null,
        2,
      ),
    );

    if (!restaurantGuid || !orderGuid) {
      console.log("Missing restaurantGuid or orderGuid in webhook details");
      return ok({ missing_ids: true });
    }

    const fullOrder = await toastGetOrder(orderGuid, restaurantGuid);

    console.log("FULL ORDER CURBSIDE PROJECTION");
    console.log(JSON.stringify(curbsideProjection(fullOrder), null, 2));

    const fullOrderRedacted = redactOrderForLogs(fullOrder);
    const fullOrderJson = JSON.stringify(fullOrderRedacted);

    console.log("FULL ORDER REDACTED JSON START");
    const chunks = chunkString(fullOrderJson, 6000);
    console.log(`FULL ORDER REDACTED JSON CHUNKS: ${chunks.length}`);
    for (let i = 0; i < chunks.length; i++) {
      console.log(`FULL ORDER REDACTED JSON CHUNK ${i + 1}/${chunks.length}`);
      console.log(chunks[i]);
    }
    console.log("FULL ORDER REDACTED JSON END");

    return ok({ fetched_full_order: true });
  } catch (err) {
    console.error("WEBHOOK ERROR", err);
    return ok({ error: String(err) });
  }
});