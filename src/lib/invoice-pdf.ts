import PDFDocument from "pdfkit"
import { Buffer } from "buffer"
import AWS from "aws-sdk"

export type InvoiceData = {
  invoiceNumber: string
  issueDate: Date
  customerName: string
  email: string
  currencyCode: string
  shippingTotal: number
  total: number
  items: {
    title: string
    quantity: number
    unitPrice: number
    size?: string
    color?: string
  }[]
}

const PAGE_MARGIN = 50
const COMPANY_BLOCK_WIDTH = 200

const s3 = new AWS.S3({
  endpoint: process.env.S3_ENDPOINT,
  accessKeyId: process.env.S3_ACCESS_KEY_ID,
  secretAccessKey: process.env.S3_SECRET_ACCESS_KEY,
  region: "auto",
})

async function fetchAssetFromR2(key: string): Promise<Buffer> {
  const data = await s3
    .getObject({ Bucket: process.env.S3_BUCKET!, Key: key })
    .promise()

  if (!data.Body) {
    throw new Error(`Asset not found in R2: ${key}`)
  }
  return data.Body as Buffer
}

export async function generateInvoicePdf(invoice: InvoiceData): Promise<Buffer> {
  const [oswald, logo] = await Promise.all([
    fetchAssetFromR2("fonts/oswald.ttf"),
    // The invoice is still valid without a logo — don't fail the order email over it.
    fetchAssetFromR2("static/volja-logo.png").catch(() => null),
  ])

  const doc = new PDFDocument({ margin: PAGE_MARGIN })
  const buffers: Buffer[] = []
  doc.on("data", (chunk) => buffers.push(chunk))
  const pdfGenerated = new Promise<Buffer>((resolve) => {
    doc.on("end", () => resolve(Buffer.concat(buffers)))
  })

  doc.registerFont("Oswald", oswald)
  doc.font("Oswald")

  const pageRight = doc.page.width - PAGE_MARGIN
  const currency = invoice.currencyCode.toUpperCase()
  const formatAmount = (value: number) => `${Number(value).toFixed(2)} ${currency}`

  // ============ HEADER: logo left, company details right ============
  if (logo) {
    doc.image(logo, PAGE_MARGIN, PAGE_MARGIN, { width: 100 })
  }

  const companyX = pageRight - COMPANY_BLOCK_WIDTH
  doc
    .fontSize(10)
    .fillColor("#000000")
    .text("Atelje Volja d.o.o.", companyX, PAGE_MARGIN, { width: COMPANY_BLOCK_WIDTH })
  doc
    .fillColor("#555555")
    .text("Njegoševa cesta, 6e", companyX, undefined, { width: COMPANY_BLOCK_WIDTH })
    .text("1000 Ljubljana, Slovenia", companyX, undefined, { width: COMPANY_BLOCK_WIDTH })
    .text("Tax no.: 83537392", companyX, undefined, { width: COMPANY_BLOCK_WIDTH })
    .text("Bank acct.: SI56028430266054011", companyX, undefined, { width: COMPANY_BLOCK_WIDTH })
    .text("BIC code: LJBASI2X", companyX, undefined, { width: COMPANY_BLOCK_WIDTH })
    .text("info@ateljevolja.si | +386 31 462 455", companyX, undefined, { width: COMPANY_BLOCK_WIDTH })

  // ============ INVOICE DETAILS ============
  doc
    .fillColor("#000000")
    .text(`Invoice No: ${invoice.invoiceNumber}`, PAGE_MARGIN, 150)
    .text(`Date of issue: ${invoice.issueDate.toLocaleDateString()}`)
    .text(`Customer: ${invoice.customerName}`)
    .text(`Email: ${invoice.email}`)
    .moveDown(1.5)

  // ============ ITEMS ============
  const tableTop = doc.y
  const itemX = PAGE_MARGIN
  const qtyX = 300
  const priceX = 370
  const totalX = 450
  const tableRight = 550

  doc
    .fillColor("#000000")
    .text("Description", itemX, tableTop)
    .text("Qty", qtyX, tableTop)
    .text("Price", priceX, tableTop)
    .text("Amount", totalX, tableTop)

  const headerBottomY = tableTop + 20
  doc
    .moveTo(itemX, headerBottomY)
    .lineTo(tableRight, headerBottomY)
    .strokeColor("#000000")
    .lineWidth(1)
    .stroke()

  let y = headerBottomY + 10
  const titleWidth = qtyX - itemX - 15
  const isHexColor = (value: string) => /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(value)
  for (const item of invoice.items) {
    doc
      .fillColor("#444444")
      .text(item.title, itemX, y, { width: titleWidth })
      .text(String(item.quantity), qtyX, y)
      .text(formatAmount(item.unitPrice), priceX, y)
      .text(formatAmount(item.unitPrice * item.quantity), totalX, y)
    let rowBottom = y + doc.heightOfString(item.title, { width: titleWidth })

    // Size and color swatch on a small detail line under the title
    if (item.size || item.color) {
      const detailY = rowBottom + 3
      doc.fontSize(8).fillColor("#777777")
      let detailX = itemX
      if (item.size) {
        const sizeLabel = `Size: ${item.size}`
        doc.text(sizeLabel, detailX, detailY, { lineBreak: false })
        detailX += doc.widthOfString(sizeLabel) + 10
      }
      if (item.color) {
        doc.text("Color:", detailX, detailY, { lineBreak: false })
        detailX += doc.widthOfString("Color:") + 4
        if (isHexColor(item.color)) {
          // Rest the swatch on the text baseline so it lines up with the labels
          const swatchSize = 7
          const ascent = ((doc as any)._font.ascender / 1000) * 8
          doc
            .roundedRect(detailX, detailY + ascent - swatchSize, swatchSize, swatchSize, 1.5)
            .lineWidth(0.5)
            .fillAndStroke(item.color, "#999999")
            .fillColor("#777777")
        } else {
          doc.text(item.color, detailX, detailY, { lineBreak: false })
        }
      }
      doc.fontSize(10)
      rowBottom = detailY + 11
    }

    y = Math.max(y + 20, rowBottom + 6)
  }

  doc
    .moveTo(itemX, y)
    .lineTo(tableRight, y)
    .strokeColor("#cccccc")
    .stroke()
    .moveDown(3)

  // ============ TOTALS ============
  const totalsOptions = { align: "right" as const, width: doc.page.width - 70 }
  doc
    .fillColor("#000000")
    .text(`Subtotal: ${formatAmount(invoice.total - invoice.shippingTotal)}`, 0, undefined, totalsOptions)
    .text(`Shipping: ${formatAmount(invoice.shippingTotal)}`, 0, undefined, totalsOptions)
    .text(`Total: ${formatAmount(invoice.total)}`, 0, undefined, totalsOptions)
    .moveDown(5)

  // ============ FOOTER ============
  doc
    .fillColor("#777777")
    .text(
      "Podjetje ni zavezanec za DDV po 1. odstavku 94. člena ZDDV-1. // The VAT has not been charged in accordance with the first paragraph of Article 94 of the Value Added Tax Act.",
      PAGE_MARGIN,
      doc.y,
      { align: "left", width: 500 }
    )

  const companyFooter =
    "Atelje VOLJA, proizvodnja in trgovina trajnostnih oblačil, d.o.o. • Njegoševa cesta 6E, 1000 Ljubljana • Matična št.: 9726136000 • Davčna št.: 83537392 • Ustanovni kapital podjetja: 7.500 EUR"
  doc.fontSize(6.5)
  const companyFooterHeight = doc.heightOfString(companyFooter, { width: 500 })
  // Zero the bottom margin so pdfkit doesn't push the footer onto a new page.
  doc.page.margins.bottom = 0
  doc.text(
    companyFooter,
    PAGE_MARGIN,
    doc.page.height - PAGE_MARGIN - companyFooterHeight,
    { align: "left", width: 500 }
  )

  doc.end()
  return pdfGenerated
}
