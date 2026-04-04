import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { ContainerRegistrationKeys, QueryContext } from "@medusajs/framework/utils"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const query = req.scope.resolve(ContainerRegistrationKeys.QUERY)

  const limit = Number(req.query.limit ?? 20)
  const offset = Number(req.query.offset ?? 0)
  const currency_code = (req.query.currency_code as string) ?? "eur"

  const { data: customs } = await query.graph({
    entity: "custom",
    fields: ["id", "pre_order_date", "product.id"],
    filters: { pre_order_date: null },
  })

  if (!customs.length) {
    return res.json({ products: [], count: 0, limit, offset })
  }

  const productIds = (customs as any[]).map((c) => c.product?.id).filter(Boolean)

  if (!productIds.length) {
    return res.json({ products: [], count: 0, limit, offset })
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
        calculated_price: QueryContext({ currency_code }),
      },
    },
  })

  const variantIds = products.flatMap((p: any) => p.variants.map((v: any) => v.id))

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

  const archivedProducts = products.filter((p: any) =>
    p.variants.length > 0 &&
    p.variants.every((v: any) => {
      const qty = inventoryMap.get(v.id) ?? 0
      return v.manage_inventory && !v.allow_backorder && qty <= 0
    })
  )

  const count = archivedProducts.length
  const paginated = archivedProducts.slice(offset, offset + limit)

  const result = paginated.map((p: any) => ({
    ...p,
    variants: p.variants.map((v: any) => ({
      ...v,
      metadata: {
        color: "#ffffff",
        size: "M",
        bg_color: "#ffffff",
        ...(v.metadata || {}),
      },
      available: false,
    })),
  }))

  res.json({ products: result, count, limit, offset })
}
