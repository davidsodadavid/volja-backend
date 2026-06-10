// Placeholder template. Replace the HTML below with the export from the
// SendGrid dashboard (Email API -> Dynamic Templates -> version -> code editor)
// to make the email look identical to the old one. Handlebars syntax
// ({{var}}, {{#each items}}) keeps working as-is.
export const ORDER_PLACED_HTML = `<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background:#f4f4f4;font-family:Arial,Helvetica,sans-serif;color:#222;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f4f4f4;padding:24px 0;">
      <tr>
        <td align="center">
          <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background:#ffffff;padding:32px;">
            <tr>
              <td align="center" style="padding-bottom:24px;">
                <img src="https://r2.ateljevolja.si/static/volja-logo.webp" alt="Atelje Volja" width="140" style="display:block;width:140px;height:auto;border:0;" />
              </td>
            </tr>
            <tr>
              <td>
                <h1 style="font-size:20px;margin:0 0 16px;">Thank you for your order, {{customer.first_name}}!</h1>
                <p style="margin:0 0 8px;">Invoice no: <strong>{{cart_id}}</strong></p>
                <p style="margin:0 0 24px;">Order date: {{order_date}}</p>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;">
                  <tr>
                    <th align="left" style="border-bottom:1px solid #ddd;padding:8px 0;font-size:13px;">Item</th>
                    <th align="center" style="border-bottom:1px solid #ddd;padding:8px 0;font-size:13px;">Qty</th>
                    <th align="right" style="border-bottom:1px solid #ddd;padding:8px 0;font-size:13px;">Price</th>
                  </tr>
                  {{#each items}}
                  <tr>
                    <td style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;">{{this.product_title}}</td>
                    <td align="center" style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;">{{this.quantity}}</td>
                    <td align="right" style="padding:8px 0;border-bottom:1px solid #eee;font-size:13px;">{{this.unit_price}} EUR</td>
                  </tr>
                  {{/each}}
                </table>

                <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:16px;">
                  <tr>
                    <td align="right" style="font-size:13px;padding:2px 0;">Subtotal: {{subtotal}} EUR</td>
                  </tr>
                  <tr>
                    <td align="right" style="font-size:13px;padding:2px 0;">Shipping: {{shipping}} EUR</td>
                  </tr>
                  <tr>
                    <td align="right" style="font-size:15px;font-weight:bold;padding:6px 0;">Total: {{total}} EUR</td>
                  </tr>
                </table>

                <p style="margin:24px 0 0;font-size:13px;">Shipping to: {{shipping_address}}</p>
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
