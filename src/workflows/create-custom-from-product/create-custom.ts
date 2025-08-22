import { createStep, StepResponse } from "@medusajs/framework/workflows-sdk"
import CustomModuleService from "../../modules/custom/service"
import { CUSTOM_MODULE } from "../../modules/custom"

type CreateCustomStepInput = {
  coming_soon?: boolean
}

export const createCustomStep = createStep(
  "create-custom",
  async (data: CreateCustomStepInput, { container }) => {
    if (!data.coming_soon) {
      return
    }

    const customModuleService: CustomModuleService = container.resolve(
      CUSTOM_MODULE
    )

    const custom = await customModuleService.createCustoms(data)

    return new StepResponse(custom, custom)
  },
  async (custom, { container }) => {
    const customModuleService: CustomModuleService = container.resolve(
      CUSTOM_MODULE
    )
    if(custom) {
        await customModuleService.deleteCustoms(custom.id)
    }
  }
)