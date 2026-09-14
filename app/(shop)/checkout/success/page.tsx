import { notFound, redirect } from "next/navigation";
import OrderSuccess from "@/components/storefront/OrderSuccess";
import { getCustomerSession } from "@/lib/auth";
import { getOrderById } from "@/lib/db";

export const metadata = { title: "Order confirmed" };

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const { order: orderNumber } = await searchParams;
  if (!orderNumber?.trim()) redirect("/shop");
  let order = null;
  try {
    order = await getOrderById(orderNumber.trim());
  } catch {
    notFound();
  }
  if (!order) notFound();
  const session = await getCustomerSession();
  const signedIn = Boolean(
    session &&
      (session.id === order.customerId || session.email.toLowerCase() === order.email.toLowerCase()),
  );
  return <OrderSuccess orderNumber={order.orderNumber} signedIn={signedIn} />;
}
