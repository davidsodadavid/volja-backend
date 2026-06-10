import {
  AbstractNotificationProviderService,
  MedusaError,
} from "@medusajs/framework/utils"
import {
  Logger,
  ProviderSendNotificationDTO,
  ProviderSendNotificationResultsDTO,
} from "@medusajs/framework/types"
import { Resend } from "resend"
import Handlebars from "handlebars"
import { emailTemplates } from "./templates"

type ResendOptions = {
  api_key: string
  from: string
}

type InjectedDependencies = {
  logger: Logger
}

class ResendNotificationProviderService extends AbstractNotificationProviderService {
  static identifier = "notification-resend"

  protected logger: Logger
  protected options: ResendOptions
  private resend: Resend

  static validateOptions(options: Record<any, any>) {
    if (!options.api_key) {
      console.warn(
        "[resend] RESEND_API_KEY is not set — emails will fail to send until it is configured"
      )
    }
    if (!options.from) {
      throw new MedusaError(
        MedusaError.Types.INVALID_DATA,
        "Resend notification provider requires a `from` option"
      )
    }
  }

  constructor({ logger }: InjectedDependencies, options: ResendOptions) {
    super()
    this.logger = logger
    this.options = options
    this.resend = new Resend(options.api_key)
  }

  async send(
    notification: ProviderSendNotificationDTO
  ): Promise<ProviderSendNotificationResultsDTO> {
    const data = (notification.data ?? {}) as Record<string, unknown>

    let html: string
    let subject: string

    if (notification.content?.html) {
      html = notification.content.html
      subject = notification.content.subject ?? (data.subject as string) ?? ""
    } else {
      const entry = emailTemplates[notification.template]
      if (!entry) {
        throw new MedusaError(
          MedusaError.Types.INVALID_DATA,
          `Unknown email template: "${notification.template}"`
        )
      }
      html = Handlebars.compile(entry.html)(data)
      subject = (data.subject as string) || entry.subject
    }

    const attachments = notification.attachments?.map((attachment) => ({
      filename: attachment.filename,
      content: attachment.content,
      contentType: attachment.content_type,
    }))

    const { data: result, error } = await this.resend.emails.send({
      from: notification.from?.trim() || this.options.from,
      to: [notification.to],
      subject,
      html,
      attachments,
    })

    if (error) {
      throw new MedusaError(
        MedusaError.Types.UNEXPECTED_STATE,
        `Failed to send email via Resend: ${error.message}`
      )
    }

    return { id: result?.id }
  }
}

export default ResendNotificationProviderService
