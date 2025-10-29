import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"


export default async function orderPlacedHandler({ event: { data }, container }: SubscriberArgs<{ id: string }>) {
    const notificationModuleService = container.resolve("notification")
    // Fetch order details and send notification

    const orderId = data.id
    const query = container.resolve("query")
    const { data: orders } = await query.graph({
        entity: "order",
        fields: ["items.*", "email", "customer.*", "shipping_address.*", "cart.*", "currency_code", "created_at", "id", "display_id", "shipping_total", "total"],
        filters: {
            id: orderId
        }
    })

    const order = orders[0]

    const address = [
        order.shipping_address?.address_1,
        order.shipping_address?.address_2,
        order.shipping_address?.postal_code,
        order.shipping_address?.city
    ].filter(Boolean)
        .join(", ");

    await notificationModuleService.createNotifications({
        to: order.email!,
        channel: "email",
        template: process.env.ORDER_PLACED_TEMPLATE_ID || "",
        data: {
            total: order.total,
            subtotal: order.total - order.shipping_total,
            shipping_address: address,
            subject: "Order Confirmation",    
            shipping: order.shipping_total,
            order_date: order.created_at.toLocaleString("en-US"),
            customer: {
                first_name: order.customer?.first_name || order.shipping_address?.first_name,
                last_name: order.customer?.last_name || order.shipping_address?.last_name,
            },
            cart_id: (order as any).display_id,
            items: order.items?.map((item) => ({
                product_title: item?.title,
                quantity: item?.quantity,
                unit_price: item?.unit_price,
                thumbnail: item?.thumbnail,
            })),
        },
    })
}
export const config: SubscriberConfig = { event: "order.placed" }