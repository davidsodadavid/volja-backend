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

  const preOrderMap = new Map(preOrders.map((c) => [c.id, c.pre_order_date]))

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
      "variants.calculated_price",  // <-- needs context below
      "custom.*",
    ],
  })

  const preOrderProducts = products
    .filter((p: any) => p.custom?.id && preOrderMap.has(p.custom.id))
    .sort((a: any, b: any) => {
      const aDate = new Date(preOrderMap.get(a.custom.id)!).getTime()
      const bDate = new Date(preOrderMap.get(b.custom.id)!).getTime()
      return bDate - aDate
    })
    .map((p: any) => ({
      ...p,
      pre_order_date: preOrderMap.get(p.custom.id),
    }))

  res.json({ products: preOrderProducts })
}
