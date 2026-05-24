import { model } from "@medusajs/framework/utils"

const EmailSubscriber = model.define("email_subscriber", {
  id: model.id().primaryKey(),
  email: model.text(),
})

export default EmailSubscriber
