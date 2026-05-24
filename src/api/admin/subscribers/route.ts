import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CUSTOM_MODULE } from "../../../modules/custom"
import CustomModuleService from "../../../modules/custom/service"

export async function GET(req: MedusaRequest, res: MedusaResponse) {
  const customService: CustomModuleService = req.scope.resolve(CUSTOM_MODULE)

  const subscribers = await customService.listEmailSubscribers(
    {},
    { order: { created_at: "DESC" } }
  )

  res.json({ subscribers, count: subscribers.length })
}
