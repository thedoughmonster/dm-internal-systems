import { ArrivalEvent, OrderEnrichment } from "./types.ts";

export async function sendSlackCheckin(
  event: ArrivalEvent,
  enrichment?: OrderEnrichment,
) {
  const webhook = Deno.env.get("SLACK_WEBHOOK_URL");
  if (!webhook) {
    console.warn("SLACK_WEBHOOK_URL not set, skipping Slack emit");
    return;
  }

  const time = new Date(event.occurredAt).toLocaleTimeString();

  const text = enrichment
    ? `🚗 *Curbside Arrival*\nOrder #${enrichment.orderNumber} · ${enrichment.customerName}\nArrived ${time}`
    : `🚗 *Curbside Arrival*\nCustomer has arrived\nTime ${time}`;

  const resp = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      blocks: [
        {
          type: "section",
          text: { type: "mrkdwn", text },
        },
      ],
    }),
  });

  if (!resp.ok) {
    const err = await resp.text();
    console.error("Slack webhook failed", err);
  }
}
