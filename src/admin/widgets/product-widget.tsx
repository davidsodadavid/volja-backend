import { defineWidgetConfig } from "@medusajs/admin-sdk"
import {
  Container,
  Heading,
  Button,
  FocusModal,
  Label,
  DatePicker,
  Select,
  Input
} from "@medusajs/ui"
import {
  DetailWidgetProps,
  AdminProduct,
} from "@medusajs/framework/types"
import { useState } from "react"

const ProductWidget = ({
  data,
}: DetailWidgetProps<AdminProduct>) => {
  const [comingSoon, setComingSoon] = useState(() => {
    const val = data.metadata?.coming_soon
    return val === "true" || val === true
  })

  const [preOrderDate, setPreOrderDate] = useState<Date | null>(() => {
    const dateVal = data.metadata?.pre_order_date;
    if (dateVal && (typeof dateVal === "string" || typeof dateVal === "number")) {
      const d = new Date(dateVal);
      if (!isNaN(d.getTime())) return d;
    }
    return null;
  });

  const [preOrderTime, setPreOrderTime] = useState<string>(() => {
    if (!preOrderDate) return "00:00";
    const hours = preOrderDate.getHours().toString().padStart(2, "0");
    const minutes = preOrderDate.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  });

  const [isOpen, setIsOpen] = useState(false);

  type Color = { name: string; hex: string }
  const [colors, setColors] = useState<Color[]>(() => {
    const existingColors = data.metadata?.colors
    if (Array.isArray(existingColors)) return existingColors
    return [{ name: "", hex: "" }, { name: "", hex: "" }, { name: "", hex: "" }]
  })

  const handleChange = (index: number, field: keyof Color, value: string) => {
    const newColors = [...colors]
    newColors[index][field] = value
    setColors(newColors)
  }

  const productStatesDefinition = [
    { value: "preorder", label: "Preorder" },
    { value: "being_made", label: "Being made" },
    { value: "shop", label: "Shop" },
    { value: "archive", label: "Archive" },
  ]

  const [productState, setProductState] = useState<string | undefined>(() => {
    const val = data.metadata?.product_state
    return typeof val === "string" ? val : undefined
  })

  type TableMetadata = {
    rowHeaders: string[]
    colHeaders: string[]
    data: string[][]
  }

  const parsedTable: TableMetadata = (() => {
    const tableStr = typeof data.metadata?.table === "string" ? data.metadata.table : "{}"
    try {
      const parsed = JSON.parse(tableStr)
      return {
        rowHeaders: parsed.rowHeaders || [],
        colHeaders: parsed.colHeaders || [],
        data: parsed.data || [],
      }
    } catch {
      return { rowHeaders: [], colHeaders: [], data: [] }
    }
  })()

  type TableCell = string

  const [tableData, setTableData] = useState<TableCell[][]>(
    parsedTable.data.length ? parsedTable.data : Array.from({ length: 6 }, () => Array(6).fill(""))
  )

  const [rowHeaders, setRowHeaders] = useState<string[]>(
    parsedTable.rowHeaders.length ? parsedTable.rowHeaders : Array.from({ length: 6 }, (_, i) => `Row ${i + 1}`)
  )

  const [colHeaders, setColHeaders] = useState<string[]>(
    parsedTable.colHeaders.length ? parsedTable.colHeaders : Array.from({ length: 6 }, (_, i) => `Col ${i + 1}`)
  )

  const handleCellChange = (rowIndex: number, colIndex: number, value: string) => {
    const updatedData = [...tableData]
    updatedData[rowIndex][colIndex] = value
    setTableData(updatedData)
  }

  const handleRowHeaderChange = (rowIndex: number, value: string) => {
    const updated = [...rowHeaders]
    updated[rowIndex] = value
    setRowHeaders(updated)
  }

  const handleColHeaderChange = (colIndex: number, value: string) => {
    const updated = [...colHeaders]
    updated[colIndex] = value
    setColHeaders(updated)
  }

  const handleSave = async () => {
    try {
      const currentRes = await fetch(`/admin/products/${data.id}`)
      if (!currentRes.ok) throw new Error("Failed to fetch product data")
      const currentData = await currentRes.json()

      // Merge date and time
      let mergedDate: Date | null = null
      if (preOrderDate) {
        const [hours, minutes] = preOrderTime.split(":").map(Number)
        if (!isNaN(hours) && !isNaN(minutes)) {
          mergedDate = new Date(preOrderDate)
          mergedDate.setHours(hours, minutes, 0, 0)
        }
      }

      const updatedMetadata = {
        ...(currentData.product.metadata || {}),
        coming_soon: comingSoon.toString(),
        product_state: productState ? productState.toString() : null,
        pre_order_date: mergedDate ? mergedDate.toLocaleString("sv-SE") : null, 
        colors: colors.map(c => ({ name: c.name, hex: c.hex })),
        table: JSON.stringify({
          rowHeaders,
          colHeaders,
          data: tableData,
        }),
      }

      console.log("Saving pre_order_date:", mergedDate?.toISOString())

      const response = await fetch(`/admin/products/${data.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ metadata: updatedMetadata }),
      })

      if (!response.ok) throw new Error("Failed to update product metadata")
      alert("Settings saved successfully.")
      setIsOpen(false)
    } catch (error: any) {
      alert("Error saving settings: " + error.message)
    }
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <Heading level="h2">Other Functionalities</Heading>

        <FocusModal open={isOpen} onOpenChange={setIsOpen}>
          <FocusModal.Trigger asChild>
            <Button onClick={() => setIsOpen(true)}>Edit Product</Button>
          </FocusModal.Trigger>

          <FocusModal.Content className="w-full h-full max-w-none max-h-none m-0 rounded-none">
            <FocusModal.Header>
              <FocusModal.Title>Edit Product</FocusModal.Title>
            </FocusModal.Header>

            <FocusModal.Body className="flex flex-col gap-6 p-6 overflow-y-auto h-[calc(100%-120px)]">
              <div className="flex gap-6">
                {/* Left Column */}
                <div className="w-1/2 flex flex-col gap-6">
                  <div className="flex justify-between items-center">
                    <Label className="font-bold" htmlFor="pre-order-date">Set preorder date:</Label>
                    <DatePicker
                      value={preOrderDate ?? new Date()} // fallback if null
                      onChange={(date) => {
                        if (!date) return
                        setPreOrderDate(prev => {
                          const hours = prev?.getHours() ?? 0
                          const minutes = prev?.getMinutes() ?? 0
                          return new Date(date.getFullYear(), date.getMonth(), date.getDate(), hours, minutes)
                        })
                      }}
                    />
                    <Label className="font-bold" htmlFor="pre-order-time">Set preorder time:</Label>
                    <Input
                      id="pre-order-time"
                      type="time"
                      value={preOrderTime}
                      onChange={(e) => setPreOrderTime(e.target.value)}
                      className="w-32"
                    />
                  </div>

                  <div className="flex gap-10 items-center">
                    <Label className="font-bold" htmlFor="product-state">State of product:</Label>
                    <div className="w-[256px]">
                      <Select
                        value={productState}
                        onValueChange={setProductState}
                      >
                        <Select.Trigger>
                          <Select.Value placeholder="Select state" />
                        </Select.Trigger>
                        <Select.Content>
                          {productStatesDefinition.map((item) => (
                            <Select.Item key={item.value} value={item.value}>
                              {item.label}
                            </Select.Item>
                          ))}
                        </Select.Content>
                      </Select>
                    </div>
                  </div>

                  {colors.map((color, index) => (
                    <div key={index} className="flex justify-between gap-8 items-center">
                      <Label className="font-bold">Color {index + 1} Name:</Label>
                      <Input
                        type="text"
                        value={color.name}
                        onChange={(e) => handleChange(index, "name", e.target.value)}
                        placeholder="Color Name"
                      />
                      <Label className="font-bold">Color {index + 1}:</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={color.hex || "#ffffff"}
                          onChange={(e) => handleChange(index, "hex", e.target.value)}
                          className="h-9 w-9 cursor-pointer rounded border border-gray-300 p-0.5"
                        />
                        <Input
                          type="text"
                          value={color.hex}
                          onChange={(e) => handleChange(index, "hex", e.target.value)}
                          placeholder="#ffffff"
                          className="w-28"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Right Column: Table */}
                <div className="w-1/2">
                  <h1 className="text-center font-bold">Size chart:</h1>
                  <Container className="p-4 bg-white rounded-md shadow-md">
                    <table className="table-auto border-collapse border border-gray-300 w-full">
                      <thead>
                        <tr>
                          <th className="border border-gray-300 p-2"> </th>
                          {colHeaders.map((col, cIdx) => (
                            <th key={cIdx} className="border border-gray-300 p-2">
                              <Input
                                value={col}
                                onChange={(e) => handleColHeaderChange(cIdx, e.target.value)}
                              />
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {tableData.map((row, rIdx) => (
                          <tr key={rIdx}>
                            <th className="border border-gray-300 p-2">
                              <Input
                                value={rowHeaders[rIdx]}
                                onChange={(e) => handleRowHeaderChange(rIdx, e.target.value)}
                              />
                            </th>
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="border border-gray-300 p-2">
                                <Input
                                  value={cell}
                                  onChange={(e) => handleCellChange(rIdx, cIdx, e.target.value)}
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </Container>
                </div>
              </div>
            </FocusModal.Body>

            <FocusModal.Footer className="sticky bottom-0 bg-white border-t border-gray-200 p-4">
              <Button onClick={() => setIsOpen(false)} variant="secondary">Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </FocusModal.Footer>
          </FocusModal.Content>
        </FocusModal>
      </div>
    </Container>
  )
}

export const config = defineWidgetConfig({
  zone: "product.details.before",
})

export default ProductWidget
