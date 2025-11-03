import { SubscriberArgs, type SubscriberConfig } from "@medusajs/framework"

export default async function fulfillmentShippedHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const notificationModuleService = container.resolve("notification");
    const shipmentId = data.id; // This is the fulfillment/shipment ID


    console.log('uslo');
    
    const query = container.resolve("query");
    const { data: [shipment] } = await query.graph({
        entity: "fulfillment",
        fields: [
            "id",
            "items.*",
            "order_id",
            "order.customer.email",
            "labels.*",
            "delivery_address.*",
            "created_at",
            // add other fields as needed
        ],
        filters: {
            id: shipmentId
        }
    })

    await notificationModuleService.createNotifications({
        to: shipment.order?.customer?.email!,
        channel: "email",
        template: process.env.SHIPPING_TEMPLATE_ID || "",
        data: {
            tracking_number: shipment.labels[0].tracking_number,
            subject: "Order Shipped",
            shipping_date: shipment.created_at.toLocaleString("en-US"),
            customer: {
                 first_name: (shipment as any)["delivery_address"]?.first_name,
            },
            delivery_name: "Pošta Slovenije / Slovenian Post",
            delivery_link: "https://moja.posta.si/tracking"
        },
    })
}

export const config: SubscriberConfig = {
    event: "shipment.created",
}