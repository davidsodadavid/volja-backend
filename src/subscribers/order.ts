import type { SubscriberArgs, SubscriberConfig } from "@medusajs/framework"
import PDFDocument from "pdfkit"
import { Buffer } from "buffer"
import path from "path";

export default async function orderPlacedHandler({
    event: { data },
    container,
}: SubscriberArgs<{ id: string }>) {
    const notificationModuleService = container.resolve("notification")
    const orderId = data.id
    const query = container.resolve("query")

    console.log('1. radi')

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

    const currentYear = new Date().getFullYear();
    const currentYearLastTwoDigits = currentYear % 100;
    const orderIdForSending = (order as any).display_id;


    console.log('2. radi')


    // 🧾 --- PDF CREATION ---
    const doc = new PDFDocument({ margin: 50 })
    const buffers: Buffer[] = []

    // const fontRegular = path.join(process.cwd(), "static", "fonts", "Oswald-Regular.ttf");
    const fontPath = path.join(__dirname, "../../static/fonts/Oswald-Regular.ttf");
    doc.registerFont("Oswald", fontPath);

    // const fontBold = path.join(process.cwd(), "static", "fonts", "Oswald-SemiBold.ttf");
    // doc.registerFont("Oswald-Bold", fontRegular);

    doc.on("data", chunk => buffers.push(chunk))
    const pdfGenerated = new Promise<Buffer>(resolve => {
        doc.on("end", () => resolve(Buffer.concat(buffers)))
    })

    // ============ HEADER ============
    doc
        .fontSize(10)
        .fillColor("#000000")
        .font("Oswald") // only for this line
        .text(`Invoice No: 000${orderIdForSending}-${currentYearLastTwoDigits}`)
        .font("Oswald")
        .text(`Date of issue: ${new Date(order.created_at).toLocaleDateString()}`)
        .text(`Customer: ${order.shipping_address?.first_name ?? ""} ${order.shipping_address?.last_name ?? ""}`)
        .text(`Email: ${order.email}`)
        .moveDown(1.5)

    doc
        .font("Oswald") // only for this line
        .fontSize(10)
        .fillColor("#000000")
        .text("Atelje Volja d.o.o.", doc.page.width - 50 - 200, 50, { width: 200 });
    doc
        .font("Oswald") // only for this line
        .fontSize(10)
        .fillColor("#555555")
        .text("Njegoševa cesta, 6e", doc.page.width - 50 - 200, undefined, { width: 200 })
        .text("1000 Ljubljana, Slovenia", doc.page.width - 50 - 200, undefined, { width: 200 })
        .text("Tax no.: 83537392", doc.page.width - 50 - 200, undefined, { width: 200 })
        .text("Bank acct.: SI56028430266054011", doc.page.width - 50 - 200, undefined, { width: 200 })
        .text("BIC code: LJBASI2X", doc.page.width - 50 - 200, undefined, { width: 200 })
        .text("info@ateljevolja.si | +386 31 462 455", doc.page.width - 50 - 200, undefined, { width: 200 })
        .moveDown(7);
    // Invoice Details


    // ============ ITEMS ============

    console.log('3. radi')
    const tableTop = doc.y
    const itemX = 50
    const qtyX = 300
    const priceX = 370
    const totalX = 450

    // Table Header
    doc
        .fontSize(10)
        .fillColor("#000000")
        .font("Oswald")
        .text("Description", itemX, tableTop)
        .text("Qty", qtyX, tableTop)
        .text("Price", priceX, tableTop)
        .text("Amount", totalX, tableTop);

    // Draw underline (border)
    const headerBottomY = tableTop + 20; // Adjust line height as needed
    doc
        .font("Oswald")
        .moveTo(itemX, headerBottomY)
        .lineTo(550, headerBottomY) // 550 is roughly page width minus margins
        .strokeColor("#000000") // or "#cccccc" for lighter line
        .lineWidth(1)
        .stroke();

    let y = headerBottomY + 10; // Start items a bit below the border

    console.log('4. radi')

    order.items?.forEach((item: any) => {
        const unitPrice = (item.unit_price ?? 0)
        const lineTotal = unitPrice * (item.quantity ?? 1)

        doc
            .fontSize(10)
            .fillColor("#444444")
            .text(item.title ?? "", itemX, y)
            .text(item.quantity ?? "", qtyX, y)
            .text(`${Number(unitPrice).toFixed(2)} ${order.currency_code.toUpperCase()}`, priceX, y)
            .text(`${Number(lineTotal).toFixed(2)} ${order.currency_code.toUpperCase()}`, totalX, y)

        y += 20
    })

    // Divider
    doc
        .moveTo(itemX, y)
        .lineTo(550, y)
        .strokeColor("#cccccc")
        .stroke()
        .moveDown(3)

    // Totals
    doc
        .fontSize(10)
        .fillColor("#000000")
        .text(`Subtotal: ${Number(order.total - order.shipping_total).toFixed(2)} ${order.currency_code}`, 0, undefined, { align: "right", width: doc.page.width - 70 })
        .text(`Shipping: ${Number(order.shipping_total).toFixed(2)} ${order.currency_code}`, 0, undefined, { align: "right", width: doc.page.width - 70 })
        .text(`Total: ${Number(order.total).toFixed(2)} ${order.currency_code}`, 0, undefined, { align: "right", width: doc.page.width - 70 })
        .moveDown(5)

    // ============ FOOTER ============
    doc
        .fontSize(10)
        .font("Oswald")
        .fillColor("#777777")
        .text(
            "Pri plačilu se sklicujte na številko računa. Prosimo, da račun poravnate do valute plačila. DDV ni obračunan na podlagi 1. odstavka 94. člena Zakona o davku na dodano vrednost.",
            50,               // x position (left margin)
            doc.y,            // current y
            { align: "left", width: 500 } // full width minus margins
        )
        .text(
            "When making the payment, please refer to the invoice number. Please settle the invoice by the payment due date. VAT has not been charged in accordance with Article 94, Paragraph 1 of the Value Added Tax Act.",
            50,
            doc.y + 15,       // a bit lower than the previous line
            { align: "left", width: 500 }
        );

    doc.end()
    const pdfBuffer = await pdfGenerated
    const base64 = pdfBuffer.toString("base64")

    console.log('5. radi')

    const notificationData = {
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
            cart_id: `000${orderIdForSending}-${currentYearLastTwoDigits}`,
            items: order.items?.map((item) => ({
                product_title: item?.title,
                quantity: item?.quantity,
                unit_price: item?.unit_price,
                thumbnail: item?.thumbnail,
            })),
        },
        attachments: [
            {
                filename: `invoice-000${orderIdForSending}-${currentYearLastTwoDigits}.pdf`,
                content: base64,
                content_type: "application/pdf",
                disposition: "attachment",
            },
        ],
    }


    console.log('6. radi')
    // 1️⃣ Send to customer
    await notificationModuleService.createNotifications({
        ...notificationData,
        to: order.email!,
    })
    console.log('7. radi')
    // 2️⃣ Send copy to internal email
    await notificationModuleService.createNotifications({
        ...notificationData,
        to: "info@ateljevolja.si",
    })

    console.log("✅ PDF generated and notifications sent for order:", orderId)
}

export const config: SubscriberConfig = { event: "order.placed" }
