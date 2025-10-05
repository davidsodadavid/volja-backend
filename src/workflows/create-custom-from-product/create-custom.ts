// src/workflows/create-custom.ts
import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import CustomModuleService from "../../modules/custom/service"

// Module key
export const CUSTOM_MODULE = "custom"

// Step input type
export type CreateCustomStepInput = {
  coming_soon?: boolean
  product_id: string
}

export const createCustomStep = createStep(
  "create-custom",
  async (data: CreateCustomStepInput, { container }) => {
    if (!data.coming_soon) {
      return
    }

    // Resolve your custom module service
    const customModuleService: CustomModuleService = container.resolve(
      CUSTOM_MODULE
    )

    // Create the custom entity in DB
    const custom = await customModuleService.createCustoms({
      coming_soon: data.coming_soon,
      product_id: data.product_id,
    })

    return new StepResponse(custom, custom)
  },
  async (custom, { container }) => {
    // Optional rollback: delete the custom entity if needed
    const customModuleService: CustomModuleService = container.resolve(
      CUSTOM_MODULE
    )
    if (custom) await customModuleService.deleteCustoms(custom.id)
  }
)
