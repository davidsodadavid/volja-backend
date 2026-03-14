import { createWorkflow, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ProductDTO } from "@medusajs/framework/types"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { CUSTOM_MODULE } from "../../modules/custom"
import { createCustomStep } from "./create-custom"

export type CreateCustomFromProductWorkflowInput = {
  product: ProductDTO
  additional_data?: {
    pre_order_date?: string | null
  }
}

export const createCustomFromProductWorkflow = createWorkflow(
  "create-custom-from-product",
  (input: CreateCustomFromProductWorkflowInput) => {
    const custom = createCustomStep({
      pre_order_date: input.additional_data?.pre_order_date ?? null,
    })

    createRemoteLinkStep([{
      [Modules.PRODUCT]: { product_id: input.product.id },
      [CUSTOM_MODULE]: { custom_id: custom.id },
    }])

    return new WorkflowResponse({ custom })
  }
)
