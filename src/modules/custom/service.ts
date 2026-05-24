import { MedusaService } from "@medusajs/framework/utils"
import Custom from "./models/custom"
import EmailSubscriber from "./models/email-subscriber"

class CustomModuleService extends MedusaService({
  Custom,
  EmailSubscriber,
}) {}

export default CustomModuleService
