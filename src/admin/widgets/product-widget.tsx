import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Button,
  Drawer,
  Label,
  Switch,
  DatePicker,
} from "@medusajs/ui"
import {
  DetailWidgetProps,
  AdminProduct,
} from "@medusajs/framework/types"
import { useState } from "react"

const ProductWidget = ({
  data,
}: DetailWidgetProps<AdminProduct>) => {
  // Initialize comingSoon state from metadata or default to false
  const [comingSoon, setComingSoon] = useState(() => {
    const val = data.metadata?.coming_soon
    return val === "true" || val === true
  })

  // Initialize preOrderDate state from metadata if available, with type-safe check
  const [preOrderDate, setPreOrderDate] = useState<Date | null>(() => {
    const dateVal = data.metadata?.pre_order_date
    if (typeof dateVal === "string" || typeof dateVal === "number") {
      return new Date(dateVal)
    }
    return null
  })

  const handleSave = async () => {
    try {
      // 1. Fetch current product data to get existing metadata
      const currentRes = await fetch(`/admin/products/${data.id}`)
      if (!currentRes.ok) throw new Error("Failed to fetch current product data")
      const currentData = await currentRes.json()

      // 2. Merge existing metadata with new values
      const updatedMetadata = {
        ...(currentData.product.metadata || {}),
        coming_soon: comingSoon.toString(),
        pre_order_date: preOrderDate ? preOrderDate.toISOString() : null,
      }

      // 3. Send update request with merged metadata
      const response = await fetch(`/admin/products/${data.id}`, {
        method: "POST", // or PATCH if supported by your API
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          metadata: updatedMetadata,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to update product metadata")
      }

      alert("Settings saved successfully.")
    } catch (error: any) {
      alert("Error saving settings: " + error.message)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Other Functionalities</Heading>

        <Drawer>
          <Drawer.Trigger asChild>
            <Button>Edit</Button>
          </Drawer.Trigger>

          <Drawer.Content>
            <Drawer.Header>
              <Drawer.Title>Edit Variant Settings</Drawer.Title>
            </Drawer.Header>

            <Drawer.Body className="p-4">
              <div className="flex flex-col gap-6 bg-white shadow-md rounded-md p-4">
                {/* Coming Soon Switch */}
                <div className="flex justify-between items-center">
                  <Label htmlFor="switch-coming-soon">Coming Soon</Label>
                  <Switch
                    id="switch-coming-soon"
                    checked={comingSoon}
                    onCheckedChange={setComingSoon}
                  />
                </div>

                {/* Pre-order Date */}
                <div className="flex justify-between items-center">
                  <Label htmlFor="pre-order-date">Pre-order Timer</Label>
                  <DatePicker
                    id="pre-order-date"
                    value={preOrderDate}
                    onChange={setPreOrderDate}
                  />
                </div>
              </div>
              <h1> {data.subtitle} </h1>
            </Drawer.Body>

            <Drawer.Footer>
              <Drawer.Close asChild>
                <Button variant="secondary">Cancel</Button>
              </Drawer.Close>
              <Button onClick={handleSave}>Save</Button>
            </Drawer.Footer>
          </Drawer.Content>
        </Drawer>
      </div>
    </Container>
  )
}

// Widget configuration
export const config = defineWidgetConfig({
  zone: "product.details.before",
})

export default ProductWidget
