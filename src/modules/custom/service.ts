import { MedusaService } from "@medusajs/framework/utils"
import Custom from "./models/custom"

class CustomModuleService extends MedusaService({
  Custom,
}){
}

export default CustomModuleService