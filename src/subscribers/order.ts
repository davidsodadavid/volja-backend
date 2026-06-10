import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import { generateInvoicePdf } from "../lib/invoice-pdf"

export default async function orderPlacedHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const notificationModuleService = container.resolve("notification")
    const query = container.resolve("query")
    const logger = container.resolve("logger")
    const orderId = data.id

    const { data: orders } = await query.graph({
        entity: "order",
        fields: [
            "items.*",
            "email",
            "customer.*",
            "shipping_address.*",
            "cart.*",
            "currency_code",
            "created_at",
            "id",
            "display_id",
            "shipping_total",
            "total",
        ],
        filters: { id: orderId },
    })

    const order = orders[0]

    const address = [
        order.shipping_address?.address_1,
        order.shipping_address?.address_2,
        order.shipping_address?.postal_code,
        order.shipping_address?.city,
    ].filter(Boolean).join(", ")

    const yearSuffix = new Date().getFullYear() % 100
    const displayId = (order as any).display_id
    const invoiceNumber = `000${displayId}-${yearSuffix}`

    const firstName = order.customer?.first_name || order.shipping_address?.first_name
    const lastName = order.customer?.last_name || order.shipping_address?.last_name

    const pdfBuffer = await generateInvoicePdf({
        invoiceNumber,
        issueDate: new Date(order.created_at),
        customerName: `${order.shipping_address?.first_name ?? ""} ${order.shipping_address?.last_name ?? ""}`.trim(),
        email: order.email ?? "",
        currencyCode: order.currency_code,
        shippingTotal: Number(order.shipping_total),
        total: Number(order.total),
        items: (order.items ?? []).map((item: any) => ({
            title: item?.title ?? "",
            quantity: item?.quantity ?? 1,
            unitPrice: item?.unit_price ?? 0,
        })),
    })

    const notificationData = {
        channel: "email",
        template: "order-placed",
        data: {
            total: order.total,
            subtotal: order.total - order.shipping_total,
            shipping_address: address,
            subject: "Order Confirmation",
            shipping: order.shipping_total,
            order_date: order.created_at.toLocaleString("en-US"),
            customer: {
                first_name: firstName,
                last_name: lastName,
            },
            cart_id: invoiceNumber,
            items: order.items?.map((item) => ({
                product_title: item?.title,
                quantity: item?.quantity,
                unit_price: item?.unit_price,
                thumbnail: item?.thumbnail,
            })),
        },
        attachments: [
            {
                filename: `invoice-${invoiceNumber}.pdf`,
                content: pdfBuffer.toString("base64"),
                content_type: "application/pdf",
                disposition: "attachment",
            },
        ],
    }

    // Send to customer, plus a copy to the internal inbox
    await notificationModuleService.createNotifications({
        ...notificationData,
        to: order.email!,
    })
    await notificationModuleService.createNotifications({
        ...notificationData,
        to: "info@ateljevolja.si",
    })

    logger.info(`Invoice ${invoiceNumber} generated and order emails sent for order ${orderId}`)
}

export const config: SubscriberConfig = { event: "order.placed" }
