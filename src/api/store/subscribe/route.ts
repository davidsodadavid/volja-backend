import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { CUSTOM_MODULE } from "../../../modules/custom"
import CustomModuleService from "../../../modules/custom/service"

const SubscribeSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
})

async function verifyTurnstile(token: string): Promise<boolean> {
  const secret = process.env.TURNSTILE_SECRET_KEY
  if (!secret) {
    throw new Error("TURNSTILE_SECRET_KEY must be set.")
  }

  const res = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body: new URLSearchParams({ secret, response: token }),
  })
  const data = await res.json() as { success: boolean }
  return data.success
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = SubscribeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: "Valid email and captcha token are required." })
  }

  const { email, token } = parsed.data

  const passed = await verifyTurnstile(token)
  if (!passed) {
    return res.status(400).json({ error: "Captcha verification failed." })
  }

  const customService: CustomModuleService = req.scope.resolve(CUSTOM_MODULE)

  const existing = await customService.listEmailSubscribers({ email })
  if (existing.length > 0) {
    return res.status(409).json({ error: "This email is already subscribed." })
  }

  await customService.createEmailSubscribers({ email })

  try {
    const notificationModuleService = req.scope.resolve("notification")
    await notificationModuleService.createNotifications({
      to: email,
      channel: "email",
      template: "subscription-confirmed",
      data: { email },
    })
  } catch (e) {
    // The subscription itself succeeded — don't fail the request over the email.
    req.scope.resolve("logger").error(`Failed to send subscription confirmation to ${email}: ${e.message}`)
  }

  return res.status(201).json({ message: "Subscribed successfully." })
}
