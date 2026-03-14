import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Button,
  Input,
  Text,
  FocusModal,
  DropdownMenu,
  IconButton,
  toast,
  Badge,
} from "@medusajs/ui"
import { EllipsisHorizontal, PencilSquare, Plus, Trash, SquareTwoStack } from "@medusajs/icons"
import { DetailWidgetProps, AdminProduct } from "@medusajs/framework/types"
import { useState } from "react"

type Measurement = { label: string; values: string[] }

type SizeChartData = {
  sizes: string[]
  measurements: Measurement[]
}

const PRESET_TOPS = ["Chest", "Waist", "Hip", "Shoulder width", "Sleeve length", "Length"]
const PRESET_BOTTOMS = ["Waist", "Hip", "Inseam", "Thigh", "Length", "Rise"]
const DEFAULT_SIZES = ["XS", "S", "M", "L", "XL", "XXL"]

function parseSizeChart(metadata: Record<string, unknown> | null | undefined): SizeChartData {
  const raw = metadata?.size_chart
  if (typeof raw === "string") {
    try {
      const parsed = JSON.parse(raw)
      if (
        parsed &&
        Array.isArray(parsed.sizes) &&
        Array.isArray(parsed.measurements)
      ) {
        return parsed as SizeChartData
      }
    } catch {}
  }
  return { sizes: [], measurements: [] }
}

function makeEmptyChart(sizes: string[], labels: string[]): SizeChartData {
  return {
    sizes,
    measurements: labels.map((label) => ({
      label,
      values: Array(sizes.length).fill(""),
    })),
  }
}

function deepClone<T>(obj: T): T {
  return JSON.parse(JSON.stringify(obj))
}

const SizeChartWidget = ({ data }: DetailWidgetProps<AdminProduct>) => {
  const initial = parseSizeChart(data.metadata as Record<string, unknown>)

  const [open, setOpen] = useState(false)
  const [saved, setSaved] = useState<SizeChartData>(initial)
  const [draft, setDraft] = useState<SizeChartData>(initial)
  const [saving, setSaving] = useState(false)

  const openEdit = () => {
    setDraft(
      saved.sizes.length > 0
        ? deepClone(saved)
        : makeEmptyChart(DEFAULT_SIZES, PRESET_TOPS)
    )
    setOpen(true)
  }

  // ── Column (size) operations ──────────────────────────────────────────────

  const addSize = () => {
    setDraft((prev) => ({
      sizes: [...prev.sizes, ""],
      measurements: prev.measurements.map((m) => ({
        ...m,
        values: [...m.values, ""],
      })),
    }))
  }

  const removeSize = (idx: number) => {
    setDraft((prev) => ({
      sizes: prev.sizes.filter((_, i) => i !== idx),
      measurements: prev.measurements.map((m) => ({
        ...m,
        values: m.values.filter((_, i) => i !== idx),
      })),
    }))
  }

  const updateSize = (idx: number, value: string) => {
    setDraft((prev) => {
      const sizes = [...prev.sizes]
      sizes[idx] = value
      return { ...prev, sizes }
    })
  }

  // ── Row (measurement) operations ──────────────────────────────────────────

  const addMeasurement = () => {
    setDraft((prev) => ({
      ...prev,
      measurements: [
        ...prev.measurements,
        { label: "", values: Array(prev.sizes.length).fill("") },
      ],
    }))
  }

  const removeMeasurement = (idx: number) => {
    setDraft((prev) => ({
      ...prev,
      measurements: prev.measurements.filter((_, i) => i !== idx),
    }))
  }

  const updateMeasurementLabel = (idx: number, value: string) => {
    setDraft((prev) => {
      const measurements = [...prev.measurements]
      measurements[idx] = { ...measurements[idx], label: value }
      return { ...prev, measurements }
    })
  }

  const updateCell = (mIdx: number, sIdx: number, value: string) => {
    setDraft((prev) => ({
      ...prev,
      measurements: prev.measurements.map((m, i) => {
        if (i !== mIdx) return m
        const values = [...m.values]
        values[sIdx] = value
        return { ...m, values }
      }),
    }))
  }

  // ── Presets ───────────────────────────────────────────────────────────────

  const applyPreset = (labels: string[]) => {
    setDraft((prev) => ({
      sizes: prev.sizes.length ? prev.sizes : [...DEFAULT_SIZES],
      measurements: labels.map((label) => ({
        label,
        values: Array(prev.sizes.length || DEFAULT_SIZES.length).fill(""),
      })),
    }))
  }

  // ── Save ─────────────────────────────────────────────────────────────────

  const handleSave = async () => {
    setSaving(true)
    try {
      const currentRes = await fetch(`/admin/products/${data.id}`)
      if (!currentRes.ok) throw new Error("Failed to fetch product")
      const currentData = await currentRes.json()

      const updatedMetadata = {
        ...(currentData.product.metadata || {}),
        size_chart: JSON.stringify(draft),
      }

      const res = await fetch(`/admin/products/${data.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: updatedMetadata }),
      })

      if (!res.ok) throw new Error("Failed to save")

      setSaved(deepClone(draft))
      setOpen(false)
      toast.success("Size chart saved!")
    } catch (err: any) {
      toast.error("Error saving size chart", { description: err.message })
    } finally {
      setSaving(false)
    }
  }

  const hasChart = saved.sizes.length > 0 && saved.measurements.length > 0

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Container className="divide-y p-0">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4">
        <div className="flex items-center gap-x-2">
          <Heading level="h2">Size Chart</Heading>
          {hasChart && (
            <Badge size="2xsmall" color="grey">
              {saved.measurements.length} rows × {saved.sizes.length} sizes
            </Badge>
          )}
        </div>

        <DropdownMenu>
          <DropdownMenu.Trigger asChild>
            <IconButton size="small" variant="transparent">
              <EllipsisHorizontal />
            </IconButton>
          </DropdownMenu.Trigger>
          <DropdownMenu.Content>
            <DropdownMenu.Item className="gap-x-2" onClick={openEdit}>
              <PencilSquare className="text-ui-fg-subtle" />
              Edit
            </DropdownMenu.Item>
          </DropdownMenu.Content>
        </DropdownMenu>
      </div>

      {/* Preview table */}
      <div className="px-6 py-4">
        {hasChart ? (
          <div className="overflow-x-auto">
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr>
                  <th className="text-left text-ui-fg-subtle font-medium pb-2 pr-4 whitespace-nowrap min-w-[120px]">
                    Measurement
                  </th>
                  {saved.sizes.map((size, i) => (
                    <th
                      key={i}
                      className="text-center text-ui-fg-subtle font-medium pb-2 px-2 whitespace-nowrap"
                    >
                      {size || <span className="italic opacity-50">—</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {saved.measurements.map((m, mIdx) => (
                  <tr key={mIdx} className="border-t border-ui-border-base">
                    <td className="py-1.5 pr-4 text-ui-fg-base font-medium whitespace-nowrap">
                      {m.label || <span className="italic text-ui-fg-muted">Unnamed</span>}
                    </td>
                    {m.values.map((val, vIdx) => (
                      <td
                        key={vIdx}
                        className="py-1.5 px-2 text-center text-ui-fg-subtle tabular-nums"
                      >
                        {val ? `${val}` : "—"}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
            <Text size="xsmall" className="text-ui-fg-muted mt-2">All values in cm</Text>
          </div>
        ) : (
          <Text size="small" className="text-ui-fg-muted">
            No size chart configured. Click edit to add one.
          </Text>
        )}
      </div>

      {/* ── Edit Modal ────────────────────────────────────────────────────── */}
      <FocusModal open={open} onOpenChange={setOpen}>
        <FocusModal.Content className="w-full h-full max-w-none max-h-none m-0 rounded-none">
          <FocusModal.Header>
            <FocusModal.Title>Edit Size Chart</FocusModal.Title>
          </FocusModal.Header>

          <FocusModal.Body className="overflow-auto h-[calc(100%-120px)] p-6 flex flex-col gap-6">
            {/* Preset buttons */}
            <div className="flex items-center gap-3 flex-wrap">
              <Text size="small" className="text-ui-fg-subtle font-medium">
                Presets:
              </Text>
              <Button
                size="small"
                variant="secondary"
                onClick={() => applyPreset(PRESET_TOPS)}
              >
                <SquareTwoStack className="mr-1.5" />
                Tops / Shirts
              </Button>
              <Button
                size="small"
                variant="secondary"
                onClick={() => applyPreset(PRESET_BOTTOMS)}
              >
                <SquareTwoStack className="mr-1.5" />
                Bottoms / Pants
              </Button>
              <Text size="xsmall" className="text-ui-fg-muted">
                Presets reset rows but keep sizes.
              </Text>
            </div>

            {/* Matrix table */}
            <div className="overflow-x-auto">
              <table className="border-collapse">
                <thead>
                  <tr>
                    {/* Corner cell */}
                    <th className="p-2 min-w-[180px] text-left">
                      <Text size="xsmall" className="text-ui-fg-muted font-medium uppercase tracking-wide">
                        Measurement ↓ / Size →
                      </Text>
                    </th>

                    {/* Size column headers */}
                    {draft.sizes.map((size, sIdx) => (
                      <th key={sIdx} className="p-2 min-w-[110px]">
                        <div className="flex flex-col items-center gap-1.5">
                          <Input
                            value={size}
                            onChange={(e) => updateSize(sIdx, e.target.value)}
                            placeholder="e.g. XS"
                            className="text-center font-semibold"
                          />
                          <button
                            type="button"
                            onClick={() => removeSize(sIdx)}
                            className="text-ui-fg-muted hover:text-red-500 transition-colors"
                            title="Remove this size"
                          >
                            <Trash className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </th>
                    ))}

                    {/* Add size column */}
                    <th className="p-2 align-top">
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={addSize}
                        className="whitespace-nowrap"
                      >
                        <Plus className="mr-1" />
                        Add Size
                      </Button>
                    </th>
                  </tr>
                </thead>

                <tbody>
                  {draft.measurements.map((m, mIdx) => (
                    <tr
                      key={mIdx}
                      className="border-t border-ui-border-base hover:bg-ui-bg-subtle transition-colors"
                    >
                      {/* Row label */}
                      <td className="p-2">
                        <div className="flex items-center gap-2">
                          <Input
                            value={m.label}
                            onChange={(e) => updateMeasurementLabel(mIdx, e.target.value)}
                            placeholder="e.g. Chest"
                          />
                          <button
                            type="button"
                            onClick={() => removeMeasurement(mIdx)}
                            className="text-ui-fg-muted hover:text-red-500 transition-colors flex-shrink-0"
                            title="Remove this measurement"
                          >
                            <Trash className="h-4 w-4" />
                          </button>
                        </div>
                      </td>

                      {/* Value cells */}
                      {m.values.map((val, sIdx) => (
                        <td key={sIdx} className="p-2">
                          <div className="relative">
                            <Input
                              type="number"
                              min="0"
                              step="0.5"
                              value={val}
                              onChange={(e) => updateCell(mIdx, sIdx, e.target.value)}
                              placeholder="—"
                              className="text-right pr-9"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-ui-fg-muted pointer-events-none select-none">
                              cm
                            </span>
                          </div>
                        </td>
                      ))}

                      {/* Empty cell under the "Add size" column */}
                      <td />
                    </tr>
                  ))}

                  {/* Add measurement row */}
                  <tr className="border-t border-ui-border-base">
                    <td className="p-2" colSpan={draft.sizes.length + 2}>
                      <Button
                        size="small"
                        variant="secondary"
                        onClick={addMeasurement}
                      >
                        <Plus className="mr-1" />
                        Add Measurement
                      </Button>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <Text size="xsmall" className="text-ui-fg-muted">
              All cell values are stored and displayed in centimetres (cm).
            </Text>
          </FocusModal.Body>

          <FocusModal.Footer className="sticky bottom-0 bg-ui-bg-base border-t border-ui-border-base p-4 flex gap-2 justify-end">
            <Button
              onClick={() => setOpen(false)}
              variant="secondary"
              size="small"
            >
              Cancel
            </Button>
            <Button onClick={handleSave} isLoading={saving} size="small">
              Save chart
            </Button>
          </FocusModal.Footer>
        </FocusModal.Content>
      </FocusModal>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.side.before",
})

export default SizeChartWidget
