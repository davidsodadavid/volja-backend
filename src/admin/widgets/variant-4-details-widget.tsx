import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Button,
  Label,
  Input,
  Textarea,
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

type VariantDetails = {
  title: string
  subtitle: string
  description: string
  material: string
  color: string
  size: string
}

const TEXT_FIELDS: { key: keyof VariantDetails; label: string }[] = [
  { key: "title", label: "Title" },
  { key: "subtitle", label: "Subtitle" },
  { key: "description", label: "Description" },
  { key: "material", label: "Material" },
]

const SIZES = ["XS", "S", "M", "L", "XL", "XXL"]

const VariantDetailsWidget = ({ data }: DetailWidgetProps<AdminProductVariant>) => {
  const initialDetails: VariantDetails = (() => {
    const read = (key: keyof VariantDetails, fallback = "") => {
      const val = data.metadata?.[key]
      return typeof val === "string" ? val : fallback
    }
    return {
      title: read("title"),
      subtitle: read("subtitle"),
      description: read("description"),
      material: read("material"),
      color: read("color", "#ffffff"),
      size: read("size", "M"),
    }
  })()

  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState(initialDetails)
  const [draft, setDraft] = useState(initialDetails)
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
            ...Object.fromEntries(
              Object.entries(draft).map(([k, v]) => [k, v.trim() === "" ? null : v])
            ),
          },
        }),
      })
      if (!res.ok) throw new Error("Failed to save")

      setSaved(draft)
      setOpen(false)
      toast.success("Success", { description: "Details saved!" })
    } catch (e: any) {
      toast.error("Error", { description: e.message })
    } finally {
      setSaving(false)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Variant Details</Heading>

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

      {TEXT_FIELDS.map(({ key, label }) => (
        <div key={key} className="flex flex-col gap-y-1 px-6 py-4">
          <Text size="small" weight="plus" className="text-ui-fg-subtle">
            {label}
          </Text>
          {saved[key] ? (
            <Text size="small" className="text-ui-fg-base whitespace-pre-wrap">
              {saved[key]}
            </Text>
          ) : (
            <Text size="small" className="text-ui-fg-muted">
              Not set
            </Text>
          )}
        </div>
      ))}

      <div className="flex flex-col gap-y-1 px-6 py-4">
        <Text size="small" weight="plus" className="text-ui-fg-subtle">
          Color
        </Text>
        <div className="flex items-center gap-3">
          <div
            className="h-4 w-4 rounded-full border border-ui-border-base"
            style={{ backgroundColor: saved.color }}
          />
          <Text size="small" className="text-ui-fg-base">
            {saved.color}
          </Text>
        </div>
      </div>

      <div className="flex flex-col gap-y-1 px-6 py-4">
        <Text size="small" weight="plus" className="text-ui-fg-subtle">
          Size
        </Text>
        <Text size="small" className="text-ui-fg-base font-medium">
          {saved.size}
        </Text>
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit Variant Details</Drawer.Title>
          </Drawer.Header>

          <Drawer.Body className="flex flex-col gap-y-4 overflow-y-auto p-6">
            {TEXT_FIELDS.map(({ key, label }) => (
              <div key={key} className="flex flex-col gap-y-2">
                <Label size="small" weight="plus">{label}</Label>
                {key === "description" ? (
                  <Textarea
                    rows={5}
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  />
                ) : (
                  <Input
                    type="text"
                    value={draft[key]}
                    onChange={(e) => setDraft({ ...draft, [key]: e.target.value })}
                  />
                )}
              </div>
            ))}

            <div className="flex flex-col gap-y-2">
              <Label size="small" weight="plus">Color</Label>
              <div className="flex items-center gap-x-3">
                <input
                  type="color"
                  value={draft.color}
                  onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                  className="h-9 w-9 cursor-pointer rounded border border-ui-border-base p-0.5"
                />
                <Input
                  type="text"
                  value={draft.color}
                  onChange={(e) => setDraft({ ...draft, color: e.target.value })}
                  placeholder="#ffffff"
                  className="w-32"
                />
              </div>
            </div>

            <div className="flex flex-col gap-y-2">
              <Label size="small" weight="plus">Size</Label>
              <Select
                value={draft.size}
                onValueChange={(size) => setDraft({ ...draft, size })}
              >
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

export default VariantDetailsWidget
