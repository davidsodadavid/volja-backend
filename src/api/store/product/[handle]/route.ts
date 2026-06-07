import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, QueryContext } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)
  const handle = req.params.handle

  const { data: products } = await query.graph({
    entity: "product",
    fields: [
      "id",
      "title",
      "subtitle",
      "material",
      "description",
      "handle",
      "thumbnail",
      "metadata",
      "images.*",
      "variants.*",
      "variants.images.*",
      "variants.calculated_price.*",
      "custom.*",
    ],
    filters: { handle },
    context: {
      variants: {
        calculated_price: QueryContext({
          currency_code: (req.query.currency_code as string) ?? "eur",
        }),
      },
    },
  })

  if (!products.length) {
    return res.status(404).json({ product: null })
  }

  const product = products[0] as any

  const pre_order_date = (product.custom as any)?.pre_order_date ?? null

  const variantIds = product.variants.map((v: any) => v.id)

  const { data: variantsWithInventory } = await query.graph({
    entity: "variant",
    fields: [
      "id",
      "inventory_items.inventory.location_levels.stocked_quantity",
      "inventory_items.inventory.location_levels.reserved_quantity",
    ],
    filters: { id: variantIds },
  })

  const inventoryMap = new Map(
    variantsWithInventory.map((v: any) => {
      const qty = (v.inventory_items ?? []).reduce((sum: number, ii: any) => {
        return sum + (ii.inventory?.location_levels ?? []).reduce((s: number, l: any) => {
          return s + ((l.stocked_quantity ?? 0) - (l.reserved_quantity ?? 0))
        }, 0)
      }, 0)
      return [v.id, qty]
    })
  )

  const result = {
    ...product,
    pre_order_date,
    variants: product.variants.map((v: any) => {
      const qty = inventoryMap.get(v.id) ?? 0
      const available = !v.manage_inventory || v.allow_backorder || qty > 0
      return {
        ...v,
        metadata: {
          color: "#ffffff",
          size: "M",
          bg_color: "#ffffff",
          ...(v.metadata || {}),
        },
        available,
      }
    }),
  }

  res.json({ product: result })
}
