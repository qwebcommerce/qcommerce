import OrdersManager from "@/components/admin/OrdersManager";
import { listOrders } from "@/lib/db";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  const orders = await listOrders();
  return <OrdersManager orders={orders} />;
}
