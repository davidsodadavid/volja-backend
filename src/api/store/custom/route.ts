import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys } from "@medusajs/framework/utils"
import { CUSTOM_MODULE } from "../../../modules/custom"
import CustomModuleService from "../../../modules/custom/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customService: CustomModuleService = req.scope.resolve(CUSTOM_MODULE)
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  // Get all pre-order records with a date set, farthest future first
  const preOrders = await customService.listCustoms(
    { pre_order_date: { $ne: null } },
    { order: { pre_order_date: "DESC" } }
  )

  if (!preOrders.length) {
    return res.json({ products: [] })
  }

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "handle",
      "thumbnail",
      "images.*",
      "variants.*",
      "variants.inventory_quantity",
      "variants.calculated_price",
      "custom.*",
    ],
    context: {
      currency_code: (req.query.currency_code as string) ?? "eur",
    },
  })
  res.json({ products })
}
