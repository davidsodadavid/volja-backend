import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Text } from "@medusajs/ui"
import { DetailWidgetProps, AdminOrder } from "@medusajs/framework/types"
import { useEffect, useState } from "react"

type ItemDetails = {
  itemId: string
  title: string
  quantity: number
  size?: string
  color?: string
}

const OrderVariantDetailsWidget = ({ data }: DetailWidgetProps<AdminOrder>) => {
  const [items, setItems] = useState<ItemDetails[] | null>(null)

  useEffect(() => {
    let cancelled = false

    const load = async () => {
      let orderItems = data.items
      if (!orderItems) {
        try {
          const res = await fetch(`/admin/orders/${data.id}?fields=%2Bitems.*`)
          if (res.ok) {
            const json = await res.json()
            orderItems = json.order?.items
          }
        } catch {
          // fall through to empty list
        }
      }

      const results = await Promise.all(
        (orderItems ?? []).map(async (item): Promise<ItemDetails> => {
          const base: ItemDetails = {
            itemId: item.id,
            title: item.title,
            quantity: Number(item.quantity),
          }
          if (!item.product_id || !item.variant_id) {
            return base
          }
          try {
            const res = await fetch(
              `/admin/products/${item.product_id}/variants/${item.variant_id}`
            )
            if (!res.ok) {
              return base
            }
            const json = await res.json()
            const meta = json.variant?.metadata || {}
            return {
              ...base,
              size: typeof meta.size === "string" && meta.size ? meta.size : undefined,
              color: typeof meta.color === "string" && meta.color ? meta.color : undefined,
            }
          } catch {
            return base
          }
        })
      )

      if (!cancelled) {
        setItems(results)
      }
    }

    load()
    return () => {
      cancelled = true
    }
  }, [data.id])

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Size &amp; Color</Heading>
      </div>

      {items === null ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-muted">
            Loading...
          </Text>
        </div>
      ) : items.length === 0 ? (
        <div className="px-6 py-4">
          <Text size="small" className="text-ui-fg-muted">
            No items
          </Text>
        </div>
      ) : (
        items.map((item) => (
          <div key={item.itemId} className="flex flex-col gap-y-1 px-6 py-4">
            <Text size="small" weight="plus" className="text-ui-fg-base">
              {item.quantity}x {item.title}
            </Text>
            <div className="flex items-center gap-x-4">
              <Text size="small" className="text-ui-fg-subtle">
                Size: {item.size ?? "—"}
              </Text>
              <div className="flex items-center gap-x-2">
                <Text size="small" className="text-ui-fg-subtle">
                  Color:
                </Text>
                {item.color ? (
                  <>
                    <div
                      className="h-4 w-4 rounded-full border border-ui-border-base"
                      style={{ backgroundColor: item.color }}
                    />
                    <Text size="small" className="text-ui-fg-subtle">
                      {item.color}
                    </Text>
                  </>
                ) : (
                  <Text size="small" className="text-ui-fg-subtle">
                    —
                  </Text>
                )}
              </div>
            </div>
          </div>
        ))
      )}
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "order.details.side.before",
})

export default OrderVariantDetailsWidget
