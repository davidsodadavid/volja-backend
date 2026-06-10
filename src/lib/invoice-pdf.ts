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
  for (const item of invoice.items) {
    doc
      .fillColor("#444444")
      .text(item.title, itemX, y)
      .text(String(item.quantity), qtyX, y)
      .text(formatAmount(item.unitPrice), priceX, y)
      .text(formatAmount(item.unitPrice * item.quantity), totalX, y)
    y += 20
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
      "Pri plačilu se sklicujte na številko računa. Prosimo, da račun poravnate do valute plačila. DDV ni obračunan na podlagi 1. odstavka 94. clena Zakona o davku na dodano vrednost.",
      PAGE_MARGIN,
      doc.y,
      { align: "left", width: 500 }
    )
    .text(
      "When making the payment, please refer to the invoice number. Please settle the invoice by the payment due date. VAT has not been charged in accordance with Article 94, Paragraph 1 of the Value Added Tax Act.",
      PAGE_MARGIN,
      doc.y + 15,
      { align: "left", width: 500 }
    )

  doc.end()
  return pdfGenerated
}
