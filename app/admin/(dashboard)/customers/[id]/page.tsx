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
      <Link href="/admin/customers" className="admin-back">
        ← Customers
      </Link>
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">{customer.email}</p>
          <h1 className="admin-title">{customer.fullName}</h1>
        </div>
        <StatusBadge status={customer.status} label={customer.status} />
      </div>
      <p className="admin-lead">
        {customer.phone || "No phone"} · Joined {formatDate(customer.createdAt)}
      </p>
      <section className="admin-panel">
        <div className="admin-panel__head">
          <h2>Orders</h2>
        </div>
        {orders.length === 0 ? (
          <p className="admin-empty">No orders yet.</p>
        ) : (
          <div className="admin-order-list">
            {orders.map((order) => (
              <Link key={order.id} href={`/admin/orders/${order.id}`} className="admin-order-row">
                <div>
                  <strong>{order.orderNumber}</strong>
                  <span>{formatDate(order.createdAt)}</span>
                </div>
                <StatusBadge status={order.paymentStatus} label={order.paymentStatus} />
                <StatusBadge status={order.status} />
                <b>{formatQar(order.total)}</b>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
