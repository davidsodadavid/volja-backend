import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import { CUSTOM_MODULE } from "../../modules/custom"
import CustomModuleService from "../../modules/custom/service"

export type CreateCustomStepInput = {
  pre_order_date?: string | null
}

export const createCustomStep = createStep(
  "create-custom-step",
  async (data: CreateCustomStepInput, { container }) => {
    const customService: CustomModuleService = container.resolve(CUSTOM_MODULE)

    const custom = await customService.createCustoms({
      pre_order_date: data.pre_order_date ? new Date(data.pre_order_date) : null,
    })

    return new StepResponse(custom, custom.id)
  },
  async (customId: string, { container }) => {
    if (!customId) return
    const customService: CustomModuleService = container.resolve(CUSTOM_MODULE)
    await customService.deleteCustoms(customId)
  }
)
