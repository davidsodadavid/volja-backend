import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, QueryContext } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const { data: customs } = await query.graph({
    entity: "custom",
    fields: ["id", "pre_order_date", "product.id"],
    filters: { pre_order_date: { $ne: null } },
  })

  if (!customs.length) {
    return res.json({ products: [] })
  }

  const preOrderMap = new Map((customs as any[]).map((c) => [c.product?.id, c.pre_order_date]))
  const productIds = (customs as any[]).map((c) => c.product?.id).filter(Boolean)

  if (!productIds.length) {
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
    filters: { id: productIds },
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

  const inventoryMap = new Map(
    variantsWithInventory.map((v: any) => [v.id, v.inventory_quantity ?? 0])
  )

  const result = products
    .sort((a: any, b: any) =>
      new Date(preOrderMap.get(a.id)!).getTime() -
      new Date(preOrderMap.get(b.id)!).getTime()
    )
    .map((p: any) => ({
      ...p,
      pre_order_date: preOrderMap.get(p.id),
      variants: p.variants.map((v: any) => {
        const qty = inventoryMap.get(v.id) ?? 0
        const available = !v.manage_inventory || v.allow_backorder || qty > 0
        return { ...v, available }
      }),
    }))

  res.json({ products: result })
}
