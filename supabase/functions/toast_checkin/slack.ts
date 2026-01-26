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

  const { event, checkinToken, orderFound, orderPayload, dbErrorMessage } = args;
  const time = new Date(event.occurredAt).toLocaleTimeString();

  let text = "";
  if (!orderFound) {
    text = `Curbside arrived but order not found in DB\nCheckin: ${checkinToken}`;
    if (dbErrorMessage) text += `\nDB error: ${dbErrorMessage}`;
  } else {
    const orderNumber =
      orderPayload?.displayNumber ??
      orderPayload?.orderNumber ??
      orderPayload?.guid ??
      checkinToken;
    const check0 = orderPayload?.checks?.[0];
    const customerFromTab = check0?.tabName;
    const customerFirst = check0?.customer?.firstName ?? "";
    const customerLast = check0?.customer?.lastName ?? "";
    const customerName =
      customerFromTab || `${customerFirst} ${customerLast}`.trim() || "Unknown customer";
    const vehicleColor = orderPayload?.curbsidePickupInfo?.transportColor ?? "";
    const vehicleDesc = orderPayload?.curbsidePickupInfo?.transportDescription ?? "";
    const vehicle = `${vehicleColor} ${vehicleDesc}`.trim() || "Vehicle unknown";
    const promisedOrEstimated =
      orderPayload?.promisedDate ?? orderPayload?.estimatedFulfillmentDate ?? null;
    const selectionsCount = orderPayload?.checks?.[0]?.selections?.length ?? 0;

    text = `Curbside arrival\nOrder #${orderNumber}\nCustomer: ${customerName}\nVehicle: ${vehicle}\nArrived ${time}`;
    if (promisedOrEstimated) text += `\nTime: ${promisedOrEstimated}`;
    if (selectionsCount) text += `\nItems: ${selectionsCount}`;
  }

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
