import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, QueryContext } from "@medusajs/framework/utils"
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
      "description",
      "handle",
      "thumbnail",
      "metadata",
      "images.*",
      "variants.*",
      "variants.calculated_price.*",
      "custom.*",
    ],
    context: {
      variants: {
        calculated_price: QueryContext({
          currency_code: (req.query.currency_code as string) ?? "eur",
        }),
      },
    },
  })

  const variantIds = products.flatMap((p: any) => p.variants.map((v: any) => v.id))

  const { data: variantsWithInventory } = await query.graph({
    entity: "variant",
    fields: ["id", "+inventory_quantity"],
    filters: { id: variantIds },
  })

  const inventoryMap = new Map(variantsWithInventory.map((v: any) => [v.id, v.inventory_quantity ?? 0]))

  const result = products.map((p: any) => ({
    ...p,
    variants: p.variants.map((v: any) => {
      const qty = inventoryMap.get(v.id) ?? 0
      const available = !v.manage_inventory || v.allow_backorder || qty > 0
      return { ...v, available }
    }),
  }))

  res.json({ products: result })
}
