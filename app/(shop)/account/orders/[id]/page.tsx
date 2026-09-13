import { notFound } from "next/navigation";
import OrderView from "@/components/storefront/OrderView";
import { getOrderById } from "@/lib/db";

export default async function OrderDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ placed?: string }>;
}) {
  const { id } = await params;
  const { placed } = await searchParams;
  const order = await getOrderById(id);
  if (!order) notFound();
  return <OrderView order={order} placed={placed === "1"} />;
}
