import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { toast } from "@medusajs/ui"
import { Container, Heading, Button, Label, Input } from "@medusajs/ui"
import { DetailWidgetProps, AdminProductVariant } from "@medusajs/framework/types"
import { useState } from "react"

const VariantColorWidget = ({ data }: DetailWidgetProps<AdminProductVariant>) => {
  const [color, setColor] = useState<string>(() => {
    const val = data.metadata?.color
    return typeof val === "string" ? val : "#ffffff"
  })

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/admin/products/${data.product_id}/variants/${data.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: {
            ...(data.metadata || {}),
            color,
          },
        }),
      })
      if (!res.ok) throw new Error("Failed to save")

      toast.success("Success", {
        description: "Color saved!",
      })
    } catch (e: any) {
      alert("Error: " + e.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Variant Color</Heading>
      </div>
      <div className="flex items-center gap-4 px-6 py-4">
        <Label className="font-bold">Pick color:</Label>
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          className="h-9 w-9 cursor-pointer rounded border border-gray-300 p-0.5"
        />
        <Input
          type="text"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          placeholder="#ffffff"
          className="w-28"
        />
        <Button onClick={handleSave} isLoading={saving}>
          Save
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product_variant.details.side.before",
})

export default VariantColorWidget
