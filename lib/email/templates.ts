import { emailBrand, siteUrl } from "@/lib/email/config";
import { formatQar } from "@/lib/format";
import type { Order } from "@/types";

function escapeHtml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function itemMeta(item: Order["items"][number]) {
  return [item.size, item.color].filter(Boolean).join(" · ");
}

function orderUrl(order: Order, kind: "created" | "ready" | "created-admin") {
  if (kind === "created-admin") return `${siteUrl()}/admin/orders/${order.id}`;
  return `${siteUrl()}/checkout/success?order=${encodeURIComponent(order.orderNumber)}`;
}

function addressBlock(order: Order) {
  const { line1, city, country, phone } = order.shippingAddress;
  return [order.customerName, line1, [city, country].filter(Boolean).join(", "), phone].filter(Boolean).join("<br />");
}

function itemsRows(order: Order, ink: string, muted: string, line: string) {
  return order.items
    .map((item) => {
      const meta = itemMeta(item);
      return `<tr>
        <td style="padding:14px 0;border-bottom:1px solid ${line};vertical-align:top;">
          <div style="font-weight:600;color:${ink};">${escapeHtml(item.name)}</div>
          ${meta ? `<div style="margin-top:4px;font-size:12px;letter-spacing:0.08em;text-transform:uppercase;color:${muted};">${escapeHtml(meta)}</div>` : ""}
          <div style="margin-top:4px;font-size:13px;color:${muted};">Qty ${item.quantity}</div>
        </td>
        <td style="padding:14px 0;border-bottom:1px solid ${line};text-align:right;vertical-align:top;white-space:nowrap;font-weight:600;color:${ink};">
          ${escapeHtml(formatQar(item.price * item.quantity))}
        </td>
      </tr>`;
    })
    .join("");
}

function totals(order: Order, ink: string, muted: string, line: string) {
  const rows = [
    ["Subtotal", formatQar(order.subtotal)],
    order.discount > 0 ? ["Discount", `− ${formatQar(order.discount)}`] : null,
    ["Shipping", order.shipping === 0 ? "Complimentary" : formatQar(order.shipping)],
  ].filter(Boolean) as [string, string][];
  return `${rows
    .map(
      ([label, value]) => `<tr>
      <td style="padding:8px 0;color:${muted};">${label}</td>
      <td style="padding:8px 0;text-align:right;color:${ink};">${escapeHtml(value)}</td>
    </tr>`,
    )
    .join("")}
    <tr>
      <td style="padding:16px 0 0;border-top:1px solid ${line};font-size:15px;letter-spacing:0.14em;text-transform:uppercase;font-weight:700;color:${ink};">Total</td>
      <td style="padding:16px 0 0;border-top:1px solid ${line};text-align:right;font-size:18px;font-weight:700;color:${ink};">${escapeHtml(formatQar(order.total))}</td>
    </tr>`;
}

export function renderOrderEmail(
  order: Order,
  kind: "created" | "ready" | "created-admin",
): { subject: string; html: string; text: string } {
  const brand = emailBrand();
  const firstName = order.customerName.trim().split(/\s+/)[0] || "there";
  const headline =
    kind === "created-admin" ? "New order" : kind === "created" ? "Order confirmed" : "Ready to ship";
  const headlineAr =
    kind === "created-admin" ? "طلب جديد" : kind === "created" ? "تم تأكيد طلبك" : "طلبك جاهز للشحن";
  const intro =
    kind === "created-admin"
      ? `A new order was placed by ${order.customerName}. Open it in admin to confirm and prepare fulfilment.`
      : kind === "created"
        ? `Thank you, ${firstName}. We have received your order and our atelier will prepare it with care.`
        : `Good news, ${firstName}. Your order is packed and ready to leave for delivery across the GCC.`;
  const introAr =
    kind === "created-admin"
      ? `تم تقديم طلب جديد من ${order.customerName}. افتحه من لوحة الإدارة للمتابعة.`
      : kind === "created"
        ? "شكراً لك. استلمنا طلبك وسنجهّزه بعناية."
        : "أخبار سارة. طلبك جاهز للشحن إلى عنوانك في الخليج.";
  const subject =
    kind === "created-admin"
      ? `${brand.name} · New order ${order.orderNumber}`
      : kind === "created"
        ? `${brand.name} · Order ${order.orderNumber} confirmed`
        : `${brand.name} · Order ${order.orderNumber} is ready to ship`;
  const cta = kind === "created-admin" ? "Open in admin" : kind === "created" ? "View order" : "Track your order";
  const payment =
    order.paymentMethod === "cod" ? "Cash on delivery" : "Paid online";

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>${escapeHtml(subject)}</title>
</head>
<body style="margin:0;padding:0;background:${brand.bg};color:${brand.ink};font-family:Georgia,'Times New Roman',serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brand.bg};padding:32px 12px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="width:100%;max-width:600px;">
          <tr>
            <td style="padding:12px 8px 28px;text-align:center;">
              <img src="${brand.logo}" alt="${escapeHtml(brand.name)}" width="132" style="display:inline-block;height:auto;max-width:132px;border:0;" />
            </td>
          </tr>
          <tr>
            <td style="background:${brand.footer};padding:36px 40px 32px;text-align:center;">
              <p style="margin:0 0 10px;font-family:Helvetica,Arial,sans-serif;font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#c9b8a3;">${escapeHtml(brand.tagline)}</p>
              <h1 style="margin:0;font-size:34px;line-height:1.15;font-weight:500;color:#ffffff;">${headline}</h1>
              <p style="margin:10px 0 0;font-size:16px;color:#d8cfc4;" dir="rtl">${headlineAr}</p>
            </td>
          </tr>
          <tr>
            <td style="height:3px;background:${brand.gold};font-size:0;line-height:0;">&nbsp;</td>
          </tr>
          <tr>
            <td style="background:${brand.surface};padding:36px 40px 20px;">
              <p style="margin:0 0 8px;font-size:16px;line-height:1.7;color:${brand.ink};">${escapeHtml(intro)}</p>
              <p style="margin:0 0 28px;font-size:14px;line-height:1.7;color:${brand.muted};" dir="rtl">${escapeHtml(introAr)}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${brand.bg};border:1px solid ${brand.line};">
                <tr>
                  <td style="padding:18px 20px;width:50%;">
                    <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${brand.muted};">Order</div>
                    <div style="margin-top:6px;font-size:18px;font-weight:700;color:${brand.ink};">${escapeHtml(order.orderNumber)}</div>
                  </td>
                  <td style="padding:18px 20px;width:50%;border-left:1px solid ${brand.line};">
                    <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${brand.muted};">Payment</div>
                    <div style="margin-top:6px;font-size:16px;color:${brand.ink};">${payment}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:${brand.surface};padding:8px 40px 8px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                ${itemsRows(order, brand.ink, brand.muted, brand.line)}
              </table>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
                ${totals(order, brand.ink, brand.muted, brand.line)}
              </table>
            </td>
          </tr>
          <tr>
            <td style="background:${brand.surface};padding:28px 40px 36px;">
              <div style="font-family:Helvetica,Arial,sans-serif;font-size:10px;letter-spacing:0.18em;text-transform:uppercase;color:${brand.muted};">Deliver to</div>
              <p style="margin:8px 0 28px;font-size:15px;line-height:1.7;color:${brand.ink};">${addressBlock(order)}</p>
              <a href="${orderUrl(order, kind)}" style="display:inline-block;background:${brand.ink};color:#ffffff;text-decoration:none;padding:14px 28px;font-family:Helvetica,Arial,sans-serif;font-size:12px;letter-spacing:0.16em;text-transform:uppercase;">${cta}</a>
            </td>
          </tr>
          <tr>
            <td style="padding:28px 16px 8px;text-align:center;font-family:Helvetica,Arial,sans-serif;font-size:12px;line-height:1.7;color:${brand.muted};">
              ${escapeHtml(brand.name)} · ${escapeHtml(brand.tagline)}<br />
              <a href="${brand.shopUrl}" style="color:${brand.ink};text-decoration:none;">Continue shopping</a>
              &nbsp;·&nbsp;
              <a href="${brand.accountOrdersUrl}" style="color:${brand.ink};text-decoration:none;">My orders</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const text = [
    `${brand.name} — ${headline}`,
    intro,
    `Order ${order.orderNumber}`,
    `Payment: ${payment}`,
    ...order.items.map((item) => `- ${item.name} × ${item.quantity} · ${formatQar(item.price * item.quantity)}`),
    `Total ${formatQar(order.total)}`,
    `Ship to: ${order.customerName}, ${order.shippingAddress.line1}, ${order.shippingAddress.city}, ${order.shippingAddress.country}`,
    orderUrl(order, kind),
  ].join("\n");

  return { subject, html, text };
}
