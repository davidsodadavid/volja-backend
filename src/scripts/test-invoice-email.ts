import { ExecArgs } from "@medusajs/framework/types"
import { generateInvoicePdf } from "../lib/invoice-pdf"

// One-off test: generate a sample invoice PDF and send the order-placed email.
// Run with: npx medusa exec ./src/scripts/test-invoice-email.ts
export default async function testInvoiceEmail({ container }: ExecArgs) {
  const notificationModuleService = container.resolve("notification")
  const logger = container.resolve("logger")

  const to = "boyan.dedic@gmail.com"
  const invoiceNumber = "00042-26"

  const items = [
    { title: "Sustainable Hoodie — Black, M", quantity: 1, unitPrice: 8900 },
    { title: "Organic Cotton Tee — White, L", quantity: 2, unitPrice: 3500 },
  ]
  const shippingTotal = 500
  const subtotal = items.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0)
  const total = subtotal + shippingTotal

  const pdfBuffer = await generateInvoicePdf({
    invoiceNumber,
    issueDate: new Date(),
    customerName: "Boyan Dedic",
    email: to,
    currencyCode: "eur",
    shippingTotal,
    total,
    items,
  })

  await notificationModuleService.createNotifications({
    to,
    channel: "email",
    template: "order-placed",
    data: {
      total,
      subtotal,
      shipping: shippingTotal,
      shipping_address: "Njegoševa cesta 6E, 1000 Ljubljana, Slovenia",
      subject: "Order Confirmation (TEST)",
      order_date: new Date().toLocaleString("en-US"),
      customer: { first_name: "Boyan", last_name: "Dedic" },
      cart_id: invoiceNumber,
      items: items.map((i) => ({
        product_title: i.title,
        quantity: i.quantity,
        unit_price: i.unitPrice,
        thumbnail: null,
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
  })

  logger.info(`Test invoice email sent to ${to}`)
}
