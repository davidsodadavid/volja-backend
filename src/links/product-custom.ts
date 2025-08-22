import { defineLink } from "@medusajs/framework/utils"
import CustomModule from "../modules/custom"
import ProductModule from "@medusajs/medusa/product"

export default defineLink(
  ProductModule.linkable.product,
  CustomModule.linkable.custom
)