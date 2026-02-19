import { defineWidgetConfig } from "@medusajs/admin-sdk"
import { Container, Heading, Button, Label, Text } from "@medusajs/ui"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { useState } from "react"

const toDatetimeLocal = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const PreorderDateWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [datetimeValue, setDatetimeValue] = useState<string>(() => {
    const val = data.metadata?.pre_order_date
    if (val && (typeof val === "string" || typeof val === "number")) {
      const d = new Date(val)
      if (!isNaN(d.getTime())) return toDatetimeLocal(d)
    }
    return ""
  })

  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const mergedDate = datetimeValue ? new Date(datetimeValue) : null

      const currentRes = await fetch(`/admin/products/${data.id}`)
      if (!currentRes.ok) throw new Error("Failed to fetch product")
      const currentData = await currentRes.json()

      const updatedMetadata = {
        ...(currentData.product.metadata || {}),
        pre_order_date: mergedDate ? mergedDate.toLocaleString("sv-SE") : null,
      }

      const res = await fetch(`/admin/products/${data.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: updatedMetadata }),
      })

      if (!res.ok) throw new Error("Failed to save")
      alert("Preorder date saved.")
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  const formattedDate = datetimeValue
    ? new Date(datetimeValue).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not set"

  return (
    <Container className="p-0 divide-y">
      <div className="px-4 py-3">
        <Heading level="h2" className="text-sm font-semibold">
          Preorder Date
        </Heading>
      </div>

      <div className="px-4 py-4 flex flex-col gap-4">
        <div>
          <Text size="small" className="text-ui-fg-subtle mb-1">Current</Text>
          <Text size="small" className="font-medium">{formattedDate}</Text>
        </div>

        <div className="flex flex-col gap-1">
          <Label className="text-xs font-medium">Date & Time</Label>
          <input
            type="datetime-local"
            value={datetimeValue}
            onChange={(e) => setDatetimeValue(e.target.value)}
            className="flex h-8 w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-1.5 text-ui-fg-base shadow-buttons-neutral transition-fg outline-none focus:shadow-details-switch-background text-sm"
          />
        </div>

        <Button
          size="small"
          onClick={handleSave}
          isLoading={saving}
          className="w-full"
        >
          Save
        </Button>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

export default PreorderDateWidget
