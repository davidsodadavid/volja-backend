import { createProductsWorkflow } from "@medusajs/medusa/core-flows"
import { 
  createCustomFromProductWorkflow, 
  CreateCustomFromProductWorkflowInput,
} from "../create-custom-from-product"

createProductsWorkflow.hooks.productsCreated(
	async ({ products, additional_data }, { container }) => {
    const workflow = createCustomFromProductWorkflow(container)
    
    for (const product of products) {
      await workflow.run({
        input: {
          product,
          additional_data,
        } as CreateCustomFromProductWorkflowInput,
      })
    }
	}
)

// Ovaj hook koci da se kreira novi proizvod