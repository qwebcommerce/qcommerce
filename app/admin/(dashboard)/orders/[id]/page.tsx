import { notFound } from "next/navigation";
import StatusBadge from "@/components/admin/StatusBadge";
import { updateOrderStatusAction } from "@/lib/actions";
import { getOrderById } from "@/lib/db";
import { formatDate, formatQar } from "@/lib/format";
import type { OrderStatus } from "@/types";

const STATUSES: OrderStatus[] = ["pending", "paid", "processing", "shipped", "delivered", "cancelled"];

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <div>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 900, marginBottom: "0.5rem" }}>{order.orderNumber}</h1>
      <p style={{ color: "var(--muted)", marginBottom: "1.5rem" }}>{formatDate(order.createdAt)} · <StatusBadge status={order.status} /></p>
      <form action={updateOrderStatusAction} style={{ display: "flex", gap: "0.75rem", marginBottom: "2rem", alignItems: "center" }}>
        <input type="hidden" name="id" value={order.id} />
        <select name="status" defaultValue={order.status} className="admin-select" style={{ width: 200 }}>
          {STATUSES.map((status) => (
            <option key={status} value={status}>{status}</option>
          ))}
        </select>
        <button className="btn-gold">Update status</button>
      </form>
      <section style={{ background: "var(--surface)", border: "1px solid var(--sand)", padding: "1.25rem", marginBottom: "1.25rem" }}>
        {order.items.map((item) => (
          <div key={`${item.productId}-${item.size}`} style={{ display: "flex", justifyContent: "space-between", padding: "0.7rem 0", borderBottom: "1px solid var(--off-white)" }}>
            <span>{item.name} {item.size ? `· ${item.size}` : ""} × {item.quantity}</span>
            <strong>{formatQar(item.price * item.quantity)}</strong>
          </div>
        ))}
        <p style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}><span>Shipping</span><span>{formatQar(order.shipping)}</span></p>
        <p style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}><span>Total</span><span>{formatQar(order.total)}</span></p>
      </section>
      <section style={{ background: "var(--surface)", border: "1px solid var(--sand)", padding: "1.25rem" }}>
        <h2 style={{ fontWeight: 800, marginBottom: "0.75rem" }}>Customer</h2>
        <p>{order.customerName}</p>
        <p style={{ color: "var(--muted)" }}>{order.email}</p>
        <p style={{ marginTop: "0.75rem" }}>{order.shippingAddress.line1}</p>
        <p>{order.shippingAddress.city}, {order.shippingAddress.country}</p>
        {order.notes && <p style={{ marginTop: "0.75rem" }}>Note: {order.notes}</p>}
      </section>
    </div>
  );
}
