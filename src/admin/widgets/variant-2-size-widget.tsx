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
  Select,
  toast,
} from "@medusajs/ui"
import { EllipsisHorizontal, PencilSquare } from "@medusajs/icons"
import { DetailWidgetProps, AdminProductVariant } from "@medusajs/framework/types"
import { useState } from "react"

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"]

const VariantSizeWidget = ({ data }: DetailWidgetProps<AdminProductVariant>) => {
  const initialSize = (() => {
    const val = data.metadata?.size
    return typeof val === "string" ? val : "M"
  })()

  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(initialSize)
  const [draft, setDraft] = useState(initialSize)
  const [saving, setSaving] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      const currentRes = await fetch(`/admin/products/${data.product_id}/variants/${data.id}`)
      if (!currentRes.ok) throw new Error("Failed to fetch variant")
      const currentData = await currentRes.json()

      const res = await fetch(`/admin/products/${data.product_id}/variants/${data.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          metadata: {
            ...(currentData.variant?.metadata || {}),
            size: draft,
          },
        }),
      })
      if (!res.ok) throw new Error("Failed to save")

      setSaved(draft)
      setOpen(false)
      toast.success("Success", { description: "Size saved!" })
    } catch (e: any) {
      toast.error("Error", { description: e.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Variant Size</Heading>

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
        {saved ? (
          <Text size="small" className="text-ui-fg-base font-medium">
            {saved}
          </Text>
        ) : (
          <Text size="small" className="text-ui-fg-muted">
            No size set
          </Text>
        )}
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit Variant Size</Drawer.Title>
          </Drawer.Header>

          <Drawer.Body className="flex flex-col gap-y-4 p-6">
            <div className="flex flex-col gap-y-2">
              <Label size="small" weight="plus">Size</Label>
              <Select value={draft} onValueChange={setDraft}>
                <Select.Trigger>
                  <Select.Value placeholder="Select a size" />
                </Select.Trigger>
                <Select.Content>
                  {SIZES.map((size) => (
                    <Select.Item key={size} value={size}>
                      {size}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
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

export default VariantSizeWidget
