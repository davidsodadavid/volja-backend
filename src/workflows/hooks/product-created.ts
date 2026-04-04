import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { createCustomFromProductWorkflow } from "../create-custom-from-product"

createProductsWorkflow.hooks.productsCreated(
  async ({ products, additional_data }, { container }) => {
    for (const product of products) {
      await createCustomFromProductWorkflow(container).run({
        input: {
          product,
          additional_data: {
            pre_order_date: (additional_data as any)?.pre_order_date ?? null,
          },
        },
      })
    }
  }
)
