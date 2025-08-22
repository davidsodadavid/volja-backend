import { model } from "@medusajs/framework/utils"

const Custom = model.define("custom", {
  id: model.id().primaryKey(),
  coming_soon: model.boolean(),
})

export default Custom