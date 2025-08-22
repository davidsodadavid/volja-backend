import CustomModuleService from "./service"
import { Module } from "@medusajs/framework/utils"

export const CUSTOM_MODULE = "custom"

export default Module(CUSTOM_MODULE, {
  service: CustomModuleService,
})