import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Button,
  Label,
  Input,
  Text,
  Drawer,
  DropdownMenu,
  IconButton,
  toast,
} from "@medusajs/ui"
import { EllipsisHorizontal, PencilSquare } from "@medusajs/icons"
import { DetailWidgetProps, AdminProductVariant } from "@medusajs/framework/types"
import { useState } from "react"

const VariantColorWidget = ({ data }: DetailWidgetProps<AdminProductVariant>) => {
  const initialColor = (() => {
    const val = data.metadata?.color
    return typeof val === "string" ? val : "#ffffff"
  })()

  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(initialColor)
  const [draft, setDraft] = useState(initialColor)
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
            color: draft,
          },
        }),
      })
      if (!res.ok) throw new Error("Failed to save")

      setSaved(draft)
      setOpen(false)
      toast.success("Success", { description: "Color saved!" })
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

      <div className="flex items-center gap-3 px-6 py-4">
        <div
          className="h-4 w-4 rounded-full border border-ui-border-base"
          style={{ backgroundColor: saved }}
        />
        <Text size="small" className="text-ui-fg-subtle">
          {saved}
        </Text>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit Variant Color</Drawer.Title>
          </Drawer.Header>

          <Drawer.Body className="flex flex-col gap-y-4 p-6">
            <div className="flex flex-col gap-y-2">
              <Label size="small" weight="plus">Color</Label>
              <div className="flex items-center gap-x-3">
                <input
                  type="color"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  className="h-9 w-9 cursor-pointer rounded border border-ui-border-base p-0.5"
                />
                <Input
                  type="text"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  placeholder="#ffffff"
                  className="w-32"
                />
              </div>
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
  zone: "product_variant.details.side.before",
})

export default VariantColorWidget
