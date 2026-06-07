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
} from "@medusajs/ui"
import { EllipsisHorizontal, PencilSquare } from "@medusajs/icons"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { useState, useEffect } from "react"

const STATE_LABELS: Record<string, string> = {
  IN_PROGRESS: "In Progress",
  PREORDER: "Pre-order",
  SHOP: "Shop",
  ARCHIVE: "Archive",
}

const STATES = Object.keys(STATE_LABELS)

const toDatetimeLocal = (d: Date) => {
  const pad = (n: number) => n.toString().padStart(2, "0")
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}

const ProductStateWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const [open, setOpen] = useState(false)
  const [savedState, setSavedState] = useState("SHOP")
  const [savedDate, setSavedDate] = useState("")
  const [draftState, setDraftState] = useState("SHOP")
  const [draftDate, setDraftDate] = useState("")
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    fetch(`/admin/custom?product_id=${data.id}`)
      .then((r) => r.json())
      .then(({ pre_order }) => {
        if (pre_order?.state) {
          setSavedState(pre_order.state)
          setDraftState(pre_order.state)
        }
        if (pre_order?.pre_order_date) {
          const formatted = toDatetimeLocal(new Date(pre_order.pre_order_date))
          setSavedDate(formatted)
          setDraftDate(formatted)
        }
      })
      .catch(() => {})
  }, [data.id])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch(`/admin/custom`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          product_id: data.id,
          state: draftState,
          pre_order_date: draftState === "PREORDER" && draftDate
            ? new Date(draftDate).toISOString()
            : null,
        }),
      })

      if (!res.ok) throw new Error("Failed to save")

      setSavedState(draftState)
      setSavedDate(draftState === "PREORDER" ? draftDate : "")
      setOpen(false)
    } catch (err: any) {
      alert("Error: " + err.message)
    } finally {
      setSaving(false)
    }
  }

  const formattedDate = savedDate
    ? new Date(savedDate).toLocaleString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Product State</Heading>

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
                setDraftState(savedState)
                setDraftDate(savedDate)
                setOpen(true)
              }}
            >
              <PencilSquare className="text-ui-fg-subtle" />
              Edit
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>

      <div className="px-6 py-4 flex flex-col gap-y-1">
        <Text size="small" className="text-ui-fg-subtle">
          {STATE_LABELS[savedState] ?? savedState}
        </Text>
        {savedState === "PREORDER" && (
          <Text size="small" className="text-ui-fg-muted">
            {formattedDate ?? "No date set"}
          </Text>
        )}
      </div>

      <Drawer open={open} onOpenChange={setOpen}>
        <Drawer.Content>
          <Drawer.Header>
            <Drawer.Title>Edit Product State</Drawer.Title>
          </Drawer.Header>

          <Drawer.Body className="flex flex-col gap-y-4 p-6">
            <div className="flex flex-col gap-y-2">
              <Label size="small" weight="plus">State</Label>
              <Select value={draftState} onValueChange={setDraftState}>
                <Select.Trigger>
                  <Select.Value />
                </Select.Trigger>
                <Select.Content>
                  {STATES.map((s) => (
                    <Select.Item key={s} value={s}>
                      {STATE_LABELS[s]}
                    </Select.Item>
                  ))}
                </Select.Content>
              </Select>
            </div>

            {draftState === "PREORDER" && (
              <div className="flex flex-col gap-y-2">
                <Label size="small" weight="plus">Preorder Date & Time</Label>
                <input
                  type="datetime-local"
                  value={draftDate}
                  onChange={(e) => setDraftDate(e.target.value)}
                  className="flex h-8 w-full rounded-md border border-ui-border-base bg-ui-bg-field px-3 py-1.5 text-ui-fg-base shadow-buttons-neutral transition-fg outline-none focus:shadow-details-switch-background text-sm"
                />
              </div>
            )}
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

export default ProductStateWidget
