import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Button,
  Label,
  Text,
  Drawer,
  DropdownMenu,
  IconButton,
} from "@medusajs/ui"
import { EllipsisHorizontal, PencilSquare } from "@medusajs/icons"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { useState } from "react"

const toDatetimeLocal = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const PreorderDateWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const initialValue = (() => {
    const val = data.metadata?.pre_order_date
    if (val && (typeof val === "string" || typeof val === "number")) {
      const d = new Date(val)
      if (!isNaN(d.getTime())) return toDatetimeLocal(d)
    }
    return ""
  })()

  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(initialValue)
  const [draft, setDraft] = useState(initialValue)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const mergedDate = draft ? new Date(draft) : null

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

      setSaved(draft)
      setOpen(false)
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  const formattedDate = saved
    ? new Date(saved).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Not set"

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Preorder Date</Heading>

        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <IconButton size="small" variant="transparent">
              <EllipsisHorizontal />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item
              className="gap-x-2"
              onClick={() => {
                setDraft(saved)
                setOpen(true)
              }}
            >
              <PencilSquare className="text-ui-fg-subtle" />
              Edit
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>

      <div className="px-6 py-4">
        <Text size="small" className="text-ui-fg-subtle">
          {formattedDate}
        </Text>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit Preorder Date</Drawer.Title>
          </Drawer.Header>

          <Drawer.Body className="flex flex-col gap-y-4 p-6">
            <div className="flex flex-col gap-y-2">
              <Label size="small" weight="plus">
                Date & Time
              </Label>
              <input
                type="datetime-local"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                className="flex h-8 w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-1.5 text-ui-fg-base shadow-buttons-neutral transition-fg outline-none focus:shadow-details-switch-background text-sm"
              />
            </div>
          </Drawer.Body>

          <Drawer.Footer>
            <div className="flex items-center justify-end gap-x-2">
              <Drawer.Close asChild>
                <Button size="small" variant="secondary">
                  Cancel
                </Button>
              </Drawer.Close>
              <Button size="small" onClick={handleSave} isLoading={saving}>
                Save
              </Button>
            </div>
          </Drawer.Footer>
        </Drawer.Content>
      </Drawer>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

export default PreorderDateWidget
