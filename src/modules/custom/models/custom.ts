import { model } from "@medusajs/framework/utils"

const Custom = model.define("custom", {
  id: model.id().primaryKey(),
  coming_soon: model.boolean(),
  product_id: model.text(), 
})

export default Custom
