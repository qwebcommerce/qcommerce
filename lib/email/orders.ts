import "server-only";
import { sendStoreEmail } from "@/lib/email/send";
import { renderOrderEmail } from "@/lib/email/templates";
import type { Order, OrderStatus } from "@/types";

const READY_STATUSES: OrderStatus[] = ["processing", "shipped"];

export async function notifyOrderCreated(order: Order) {
  try {
    const message = renderOrderEmail(order, "created");
    await sendStoreEmail({ to: order.email, ...message });
  } catch (error) {
    console.error("Order confirmation email failed:", error);
  }
}

export async function notifyOrderReadyToShip(order: Order) {
  try {
    const message = renderOrderEmail(order, "ready");
    await sendStoreEmail({ to: order.email, ...message });
  } catch (error) {
    console.error("Ready-to-ship email failed:", error);
  }
}

export function shouldSendReadyToShip(previous: OrderStatus, next: OrderStatus) {
  return !READY_STATUSES.includes(previous) && READY_STATUSES.includes(next);
}
