import { model } from "@medusajs/framework/utils"

export enum ProductState {
  IN_PROGRESS = "IN_PROGRESS",
  PREORDER = "PREORDER",
  SHOP = "SHOP",
  ARCHIVE = "ARCHIVE",
}

const Custom = model.define("custom", {
  id: model.id().primaryKey(),
  pre_order_date: model.dateTime().nullable(),
  state: model.enum(Object.values(ProductState)).default(ProductState.SHOP),
})

export default Custom
