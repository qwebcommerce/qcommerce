import AdminDashboard from "@/components/admin/AdminDashboard";
import { getDashboardStats, listAllProducts, listOrders } from "@/lib/db";

export const metadata = { title: "Admin" };

export default async function AdminHomePage() {
  const [stats, orders, products] = await Promise.all([getDashboardStats(), listOrders(), listAllProducts()]);
  return <AdminDashboard stats={stats} orders={orders} products={products} />;
}
