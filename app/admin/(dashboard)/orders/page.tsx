import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { listOrders } from "@/lib/db";
import { formatDate, formatQar } from "@/lib/format";

export const metadata = { title: "Orders" };

export default async function AdminOrdersPage() {
  const orders = await listOrders();

  return (
    <div>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 900, marginBottom: "1.5rem" }}>ORDERS</h1>
      <div style={{ background: "var(--surface)", border: "1px solid var(--sand)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--sand)" }}>
              <th style={{ padding: "0.85rem" }}>Order</th>
              <th>Customer</th>
              <th>Date</th>
              <th>Status</th>
              <th>Total</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} style={{ borderBottom: "1px solid var(--off-white)" }}>
                <td style={{ padding: "0.85rem" }}>
                  <Link href={`/admin/orders/${order.id}`} style={{ fontWeight: 700, color: "inherit" }}>{order.orderNumber}</Link>
                </td>
                <td>{order.customerName}<div style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{order.email}</div></td>
                <td>{formatDate(order.createdAt)}</td>
                <td><StatusBadge status={order.status} /></td>
                <td>{formatQar(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
