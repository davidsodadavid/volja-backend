import { ORDER_PLACED_HTML } from "./order-placed"
import { SHIPMENT_CREATED_HTML } from "./shipment-created"

export const emailTemplates: Record<string, { subject: string; html: string }> = {
  "order-placed": {
    subject: "Order Confirmation",
    html: ORDER_PLACED_HTML,
  },
  "shipment-created": {
    subject: "Order Shipped",
    html: SHIPMENT_CREATED_HTML,
  },
}
