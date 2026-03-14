import { model } from "@medusajs/framework/utils"

const Custom = model.define("custom", {
  id: model.id().primaryKey(),
  pre_order_date: model.dateTime().nullable(),
})

export default Custom
