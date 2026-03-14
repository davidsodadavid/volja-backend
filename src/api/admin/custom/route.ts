import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, Modules } from "@medusajs/framework/utils"
import { CUSTOM_MODULE } from "../../../modules/custom"
import CustomModuleService from "../../../modules/custom/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const { product_id } = req.query as { product_id?: string }

  if (!product_id) {
    return res.status(400).json({ message: "product_id query param is required" })
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const { data: [product] } = await query.graph({
    entity: "product",
    fields: ["custom.*"],
    filters: { id: product_id },
  })

  res.json({ pre_order: product?.custom ?? null })
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const { product_id, pre_order_date } = req.body as {
    product_id: string
    pre_order_date: string | null
  }

  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const customService: CustomModuleService = req.scope.resolve(CUSTOM_MODULE)
  const remoteLink = req.scope.resolve(ContainerRegistrationKeys.REMOTE_LINK)

  const { data: [product] } = await query.graph({
    entity: "product",
    fields: ["custom.*"],
    filters: { id: product_id },
  })

  const existing = product?.custom as { id: string } | null | undefined

  if (existing?.id) {
    const updated = await customService.updateCustoms({
      id: existing.id,
      pre_order_date: pre_order_date ? new Date(pre_order_date) : null,
    })
    return res.json({ pre_order: updated })
  }

  const custom = await customService.createCustoms({
    pre_order_date: pre_order_date ? new Date(pre_order_date) : null,
  })

  await remoteLink.create([{
    [Modules.PRODUCT]: { product_id },
    [CUSTOM_MODULE]: { custom_id: custom.id },
  }])

  res.json({ pre_order: custom })
}
