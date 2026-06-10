import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { CUSTOM_MODULE } from "../../../../modules/custom"
import CustomModuleService from "../../../../modules/custom/service"

export async function DELETE(req: MedusaRequest, res: MedusaResponse) {
  const customService: CustomModuleService = req.scope.resolve(CUSTOM_MODULE)

  await customService.deleteEmailSubscribers(req.params.id)

  res.json({ id: req.params.id, deleted: true })
}
