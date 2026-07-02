import { ExecArgs } from "@medusajs/framework/types"

// One-off check: verify the "variant" entity query works and inspect metadata shape.
// Run with: npx medusa exec ./src/scripts/test-variant-details.ts
export default async function testVariantDetails({ container }: ExecArgs) {
  const query = container.resolve("query")
  const logger = container.resolve("logger")

  const { data: variants } = await query.graph({
    entity: "variant",
    fields: ["id", "title", "metadata", "product.title"],
    pagination: { take: 5, skip: 0 },
  })

  if (!variants.length) {
    logger.warn("No variants found")
    return
  }

  for (const variant of variants) {
    logger.info(
      `${(variant as any).product?.title} / ${variant.title} [${variant.id}] metadata: ${JSON.stringify(variant.metadata ?? null)}`
    )
  }
}
