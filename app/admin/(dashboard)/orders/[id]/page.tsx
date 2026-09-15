import Link from "next/link";
import { notFound } from "next/navigation";
import OrderStatusControls from "@/components/admin/OrderStatusControls";
import { getOrderById } from "@/lib/db";
import { formatDate, formatQar } from "@/lib/format";

export default async function AdminOrderPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) notFound();

  return (
    <div>
      <Link href="/admin/orders" className="admin-back">
        ← Orders
      </Link>
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">{order.customerId ? "Account" : "Guest"}</p>
          <h1 className="admin-title">{order.orderNumber}</h1>
        </div>
        <p className="admin-updated">{formatDate(order.createdAt)}</p>
      </div>
      <OrderStatusControls order={order} />
      <section className="admin-panel" style={{ marginBottom: "1.25rem" }}>
        {order.items.map((item) => (
          <div
            key={`${item.productId}-${item.size}-${item.color}`}
            style={{
              display: "flex",
              justifyContent: "space-between",
              padding: "0.7rem 0",
              borderBottom: "1px solid var(--off-white)",
            }}
          >
            <span>
              {item.name} {item.size ? `· ${item.size}` : ""} {item.color ? `· ${item.color}` : ""} × {item.quantity}
            </span>
            <strong>{formatQar(item.price * item.quantity)}</strong>
          </div>
        ))}
        <p style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}>
          <span>Shipping</span>
          <span>{formatQar(order.shipping)}</span>
        </p>
        {order.discount > 0 ? (
          <p style={{ display: "flex", justifyContent: "space-between" }}>
            <span>Discount{order.promoCode ? ` · ${order.promoCode}` : ""}</span>
            <span>−{formatQar(order.discount)}</span>
          </p>
        ) : null}
        <p style={{ display: "flex", justifyContent: "space-between", fontWeight: 800 }}>
          <span>Total</span>
          <span>{formatQar(order.total)}</span>
        </p>
      </section>
      <section className="admin-panel">
        <h2 style={{ fontWeight: 800, marginBottom: "0.75rem" }}>Customer</h2>
        <p>{order.customerName}</p>
        <p style={{ color: "var(--muted)" }}>{order.email}</p>
        {order.shippingAddress.phone ? <p style={{ marginTop: "0.75rem" }}>{order.shippingAddress.phone}</p> : null}
        <p style={{ marginTop: "0.75rem" }}>{order.shippingAddress.line1}</p>
        <p>
          {order.shippingAddress.city}, {order.shippingAddress.country}
        </p>
        {order.notes ? <p style={{ marginTop: "0.75rem" }}>Note: {order.notes}</p> : null}
      </section>
    </div>
  );
}
