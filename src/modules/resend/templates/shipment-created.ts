// Placeholder template. Replace the HTML below with the export from the
// SendGrid dashboard (Email API -> Dynamic Templates -> version -> code editor)
// to make the email look identical to the old one. Handlebars syntax
// ({{var}}) keeps working as-is.
export const SHIPMENT_CREATED_HTML = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#222;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:32px;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <img src="https://r2.ateljevolja.si/static/volja-logo.png" alt="Atelje Volja" width="140" style="display:block;width:140px;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td>
                <h1 style="font-size:20px;margin:0 0 16px;">Your order is on its way, {{customer.first_name}}!</h1>
                <p style="margin:0 0 8px;">Shipped on: {{shipping_date}}</p>
                <p style="margin:0 0 8px;">Carrier: {{delivery_name}}</p>
                <p style="margin:0 0 8px;">Tracking number: <strong>{{tracking_number}}</strong></p>
                <p style="margin:16px 0 0;">
                  <a href="{{delivery_link}}" style="color:#1a73e8;">Track your shipment</a>
                </p>
                <p style="margin:24px 0 0;font-size:12px;color:#777;">
                  Atelje Volja d.o.o. &middot; Njegoševa cesta 6e, 1000 Ljubljana, Slovenia &middot; info@ateljevolja.si
                </p>
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`
