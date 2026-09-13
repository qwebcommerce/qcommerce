import Link from "next/link";
import { notFound } from "next/navigation";
import StatusBadge from "@/components/admin/StatusBadge";
import { getCustomerById, listOrdersByCustomer } from "@/lib/db";
import { formatDate, formatQar } from "@/lib/format";

export default async function AdminCustomerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const customer = await getCustomerById(id);
  if (!customer) notFound();
  const orders = await listOrdersByCustomer(customer.id, customer.email);

  return (
    <div>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 900 }}>{customer.fullName}</h1>
      <p style={{ color: "var(--muted)", margin: "0.5rem 0 2rem" }}>{customer.email} · {customer.phone || "No phone"}</p>
      <h2 style={{ fontWeight: 800, marginBottom: "1rem" }}>Orders</h2>
      {orders.length === 0 && <p style={{ color: "var(--muted)" }}>No orders yet.</p>}
      {orders.map((order) => (
        <Link key={order.id} href={`/admin/orders/${order.id}`} style={{ display: "flex", justifyContent: "space-between", background: "var(--surface)", border: "1px solid var(--sand)", padding: "0.9rem 1rem", marginBottom: "0.6rem", textDecoration: "none", color: "inherit" }}>
          <span>{order.orderNumber}</span>
          <span>{formatDate(order.createdAt)}</span>
          <StatusBadge status={order.status} />
          <span>{formatQar(order.total)}</span>
        </Link>
      ))}
    </div>
  );
}
