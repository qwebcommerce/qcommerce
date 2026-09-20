import "server-only";
import { adminNotifyEmail } from "@/lib/email/config";
import { sendStoreEmail } from "@/lib/email/send";
import { renderOrderEmail } from "@/lib/email/templates";
import type { Order, OrderStatus } from "@/types";

const READY_STATUSES: OrderStatus[] = ["processing", "shipped"];

function emailDidFail(result: { ok?: true; skipped?: true; error?: string } | undefined) {
  return Boolean(result?.error || result?.skipped);
}

export async function notifyOrderCreated(order: Order) {
  const customer = order.email.trim();
  const admin = adminNotifyEmail();
  let emailFailed = false;
  try {
    const sent = await sendStoreEmail({ to: customer, ...renderOrderEmail(order, "created") });
    if (emailDidFail(sent)) emailFailed = true;
  } catch (error) {
    emailFailed = true;
    console.error("Order confirmation email failed:", error);
  }
  if (admin && admin !== customer.toLowerCase()) {
    try {
      const sent = await sendStoreEmail({ to: admin, ...renderOrderEmail(order, "created-admin") });
      if (emailDidFail(sent)) emailFailed = true;
    } catch (error) {
      emailFailed = true;
      console.error("Admin new-order email failed:", error);
    }
  }
  return { emailFailed };
}

export async function notifyOrderReadyToShip(order: Order) {
  try {
    const sent = await sendStoreEmail({ to: order.email, ...renderOrderEmail(order, "ready") });
    return { emailFailed: emailDidFail(sent) };
  } catch (error) {
    console.error("Ready-to-ship email failed:", error);
    return { emailFailed: true };
  }
}

export function shouldSendReadyToShip(previous: OrderStatus, next: OrderStatus) {
  return !READY_STATUSES.includes(previous) && READY_STATUSES.includes(next);
}
