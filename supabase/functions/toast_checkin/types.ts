export type ArrivalEvent = {
  eventType: "curbside.arrived";
  occurredAt: string;
  checkinToken: string;
  request: {
    ip: string;
    userAgent?: string;
  };
};

export type OrderEnrichment = {
  orderNumber: string;
  customerName: string;
};
