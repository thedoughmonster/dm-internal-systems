import { OrderEnrichment } from "./types.ts";

export const DEV_ORDER_ENRICHMENT: Record<string, OrderEnrichment> = {
  // "REAL_TOAST_ORDER_GUID": {
  //   orderNumber: "1247",
  //   customerName: "Alex M",
  // },
};

export function getOrderEnrichment(checkinToken: string): OrderEnrichment | undefined {
  return DEV_ORDER_ENRICHMENT[checkinToken];
}
