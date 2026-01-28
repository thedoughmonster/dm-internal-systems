import { ArrivalEvent } from "./types.ts";

export async function sendSlackCheckin(args: {
  event: ArrivalEvent;
  checkinToken: string;
  orderFound: boolean;
  orderPayload: any | null;
  dbErrorMessage: string | null;
}) {
  const webhook = Deno.env.get("SLACK_WEBHOOK_URL");
  if (!webhook) {
    console.warn("SLACK_WEBHOOK_URL not set, skipping Slack emit");
    return;
  }

  const { event, checkinToken, orderFound, orderPayload } = args;
  const time = new Date(event.occurredAt).toLocaleTimeString();

  const lines: string[] = ["🚗 Curbside arrival", ""];

  const orderNumber =
    orderPayload?.displayNumber ??
    orderPayload?.orderNumber ??
    orderPayload?.guid ??
    checkinToken;

  if (!orderFound) {
    lines.push(`🧾 Order #${checkinToken}`);
    lines.push("Order not found in DB");
  } else {
    if (orderNumber) {
      lines.push(`🧾 Order #${orderNumber}`);
    }

    const check0 = orderPayload?.checks?.[0];
    const customerFromTab = check0?.tabName ?? "";
    const customerFirst = check0?.customer?.firstName ?? "";
    const customerLast = check0?.customer?.lastName ?? "";
    const customerName =
      customerFromTab || `${customerFirst} ${customerLast}`.trim();

    if (customerName) {
      lines.push(`👤 ${customerName}`);
    }

    const vehicleColor =
      orderPayload?.curbsidePickupInfo?.transportColor ?? "";
    const vehicleDesc =
      orderPayload?.curbsidePickupInfo?.transportDescription ?? "";
    const vehicle = `${vehicleColor} ${vehicleDesc}`.trim();

    if (vehicle) {
      lines.push(`🚙 ${vehicle}`);
    }

    const footerLines: string[] = [];

    if (time) {
      footerLines.push(`⌚ Arrived ${time}`);
    }

    const selectionsCount =
      orderPayload?.checks?.[0]?.selections?.length ?? 0;

    if (Number.isInteger(selectionsCount) && selectionsCount > 0) {
      footerLines.push(`🍩 Items: ${selectionsCount}`);
    }

    if (footerLines.length > 0) {
      lines.push("", ...footerLines);
    }
  }

  const text = lines.join("\n");

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
