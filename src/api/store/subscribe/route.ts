import { MedusaRequest, MedusaResponse } from "@medusajs/framework/http"
import { z } from "zod"
import { RecaptchaEnterpriseServiceClient } from "@google-cloud/recaptcha-enterprise"
import { CUSTOM_MODULE } from "../../../modules/custom"
import CustomModuleService from "../../../modules/custom/service"

const SubscribeSchema = z.object({
  email: z.string().email(),
  token: z.string().min(1),
})

// Cached at module level per Google's recommendation
let recaptchaClient: RecaptchaEnterpriseServiceClient | null = null
function getRecaptchaClient() {
  if (!recaptchaClient) {
    recaptchaClient = new RecaptchaEnterpriseServiceClient()
  }
  return recaptchaClient
}

async function verifyRecaptcha(token: string): Promise<boolean> {
  const projectID = process.env.RECAPTCHA_PROJECT_ID
  const recaptchaKey = process.env.RECAPTCHA_SITE_KEY

  if (!projectID || !recaptchaKey) {
    throw new Error("RECAPTCHA_PROJECT_ID and RECAPTCHA_SITE_KEY must be set.")
  }

  const client = getRecaptchaClient()
  const projectPath = client.projectPath(projectID)

  const [response] = await client.createAssessment({
    assessment: {
      event: {
        token,
        siteKey: recaptchaKey,
      },
    },
    parent: projectPath,
  })

  if (!response.tokenProperties?.valid) {
    return false
  }

  if (response.tokenProperties.action !== "subscribe") {
    return false
  }

  const score = response.riskAnalysis?.score ?? 0
  return score >= 0.5
}

export async function POST(req: MedusaRequest, res: MedusaResponse) {
  const parsed = SubscribeSchema.safeParse(req.body)
  if (!parsed.success) {
    return res.status(400).json({ error: "Valid email and captcha token are required." })
  }

  const { email, token } = parsed.data

  const passed = await verifyRecaptcha(token)
  if (!passed) {
    return res.status(400).json({ error: "Captcha verification failed." })
  }

  const customService: CustomModuleService = req.scope.resolve(CUSTOM_MODULE)

  const existing = await customService.listEmailSubscribers({ email })
  if (existing.length > 0) {
    return res.status(409).json({ error: "This email is already subscribed." })
  }

  await customService.createEmailSubscribers({ email })

  return res.status(201).json({ message: "Subscribed successfully." })
}
