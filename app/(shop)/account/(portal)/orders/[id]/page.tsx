import { notFound, redirect } from "next/navigation";
import OrderView from "@/components/storefront/OrderView";
import { getCustomerSession } from "@/lib/auth";
import { getOrderById } from "@/lib/db";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCustomerSession();
  if (!session) redirect("/account/login");
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();
  const owns =
    order.customerId === session.id ||
    order.email.toLowerCase() === session.email.toLowerCase();
  if (!owns) notFound();
  return <OrderView order={order} />;
}
