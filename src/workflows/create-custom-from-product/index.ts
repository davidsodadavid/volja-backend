import { createWorkflow, transform, when, WorkflowResponse } from "@medusajs/framework/workflows-sdk"
import { ProductDTO } from "@medusajs/framework/types"
import { createRemoteLinkStep } from "@medusajs/medusa/core-flows"
import { Modules } from "@medusajs/framework/utils"
import { CUSTOM_MODULE } from "../../modules/custom"
import { createCustomStep } from "./create-custom"

export type CreateCustomFromProductWorkflowInput = {
  product: ProductDTO
  additional_data?: {
    coming_soon?: boolean
  }
}

export const createCustomFromProductWorkflow = createWorkflow(
  "create-custom-from-product",
  (input: CreateCustomFromProductWorkflowInput) => {
    const comingSoon = transform(
      {
        input,
      },
      (data) => data.input.additional_data?.coming_soon || false
    )

    const custom = createCustomStep({
      coming_soon: comingSoon,
    })

    when(({ custom }), ({ custom }) => custom !== undefined)
      .then(() => {
        createRemoteLinkStep([{
          [Modules.PRODUCT]: {
            product_id: input.product.id,
          },
          [CUSTOM_MODULE]: {
            custom_id: custom.id,
          },      
        }])
      })

    return new WorkflowResponse({
      custom,
    })
  }
)