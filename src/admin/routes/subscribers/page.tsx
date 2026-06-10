import { defineRouteConfig } from "@medusajs/admin-sdk"
import { EnvelopeSolid, Trash } from "@medusajs/icons"
import { Container, Heading, Table, Text, Button, IconButton, toast, usePrompt } from "@medusajs/ui"
import { useEffect, useState } from "react"

type Subscriber = {
  id: string
  email: string
  created_at: string
}

const SubscribersPage = () => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([])
  const [loading, setLoading] = useState(true)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const prompt = usePrompt()

  const handleDelete = async (subscriber: Subscriber) => {
    const confirmed = await prompt({
      title: "Delete subscriber",
      description: `Are you sure you want to remove ${subscriber.email} from the list? This cannot be undone.`,
      confirmText: "Delete",
      cancelText: "Cancel",
    })
    if (!confirmed) {
      return
    }

    setDeletingId(subscriber.id)
    try {
      const res = await fetch(`/admin/subscribers/${subscriber.id}`, {
        method: "DELETE",
      })
      if (!res.ok) {
        throw new Error()
      }
      setSubscribers((prev) => prev.filter((s) => s.id !== subscriber.id))
      toast.success(`Removed ${subscriber.email}.`)
    } catch {
      toast.error("Failed to delete subscriber.")
    } finally {
      setDeletingId(null)
    }
  }

  useEffect(() => {
    fetch("/admin/subscribers")
      .then((r) => r.json())
      .then(({ subscribers }) => setSubscribers(subscribers ?? []))
      .catch(() => toast.error("Failed to load subscribers."))
      .finally(() => setLoading(false))
  }, [])

  const handleDownloadCsv = () => {
    const rows = [
      ["Email Address", "Subscribed At"],
      ...subscribers.map((s) => [
        s.email,
        new Date(s.created_at).toISOString(),
      ]),
    ]
    const csv = rows.map((r) => r.join(",")).join("\n")
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `subscribers-${new Date().toISOString().slice(0, 10)}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleCopyAll = () => {
    const emails = subscribers.map((s) => s.email).join("\n")
    navigator.clipboard.writeText(emails).then(() =>
      toast.success(`Copied ${subscribers.length} emails to clipboard.`)
    )
  }

  return (
    <Container className="divide-y p-0">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <Heading level="h2">Newsletter Subscribers</Heading>
          <Text size="small" className="text-ui-fg-subtle mt-1">
            {loading ? "Loading..." : `${subscribers.length} subscribers`}
          </Text>
        </div>
        <div className="flex gap-2">
          <Button
            size="small"
            variant="secondary"
            onClick={handleCopyAll}
            disabled={loading || subscribers.length === 0}
          >
            Copy all emails
          </Button>
          <Button
            size="small"
            variant="primary"
            onClick={handleDownloadCsv}
            disabled={loading || subscribers.length === 0}
          >
            Download CSV
          </Button>
        </div>
      </div>

      <Table>
        <Table.Header>
          <Table.Row>
            <Table.HeaderCell>Email</Table.HeaderCell>
            <Table.HeaderCell>Subscribed at</Table.HeaderCell>
            <Table.HeaderCell></Table.HeaderCell>
          </Table.Row>
        </Table.Header>
        <Table.Body>
          {loading ? (
            <Table.Row>
              <Table.Cell {...({ colSpan: 3 } as any)}>
                <Text size="small" className="text-ui-fg-subtle">Loading...</Text>
              </Table.Cell>
            </Table.Row>
          ) : subscribers.length === 0 ? (
            <Table.Row>
              <Table.Cell {...({ colSpan: 3 } as any)}>
                <Text size="small" className="text-ui-fg-subtle">No subscribers yet.</Text>
              </Table.Cell>
            </Table.Row>
          ) : (
            subscribers.map((s) => (
              <Table.Row key={s.id}>
                <Table.Cell>{s.email}</Table.Cell>
                <Table.Cell>
                  {new Date(s.created_at).toLocaleString("en-GB", {
                    day: "2-digit",
                    month: "short",
                    year: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </Table.Cell>
                <Table.Cell className="text-right">
                  <IconButton
                    size="small"
                    variant="transparent"
                    disabled={deletingId === s.id}
                    onClick={() => handleDelete(s)}
                  >
                    <Trash />
                  </IconButton>
                </Table.Cell>
              </Table.Row>
            ))
          )}
        </Table.Body>
      </Table>
    </Container>
  )
}

export const config = defineRouteConfig({
  label: "Subscribers",
  icon: EnvelopeSolid,
})

export default SubscribersPage
