import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { getDashboardStats, listOrders, listAllProducts } from "@/lib/db";
import { formatDate, formatQar } from "@/lib/format";

export const metadata = { title: "Admin" };

export default async function AdminHomePage() {
  const [stats, orders, products] = await Promise.all([getDashboardStats(), listOrders(), listAllProducts()]);
  const recent = orders.slice(0, 6);
  const lowStock = products.filter((p) => p.stock <= 10).slice(0, 6);

  return (
    <div>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 900, letterSpacing: "0.08em", marginBottom: "1.5rem" }}>DASHBOARD</h1>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4" style={{ marginBottom: "2rem" }}>
        {[
          { label: "Revenue", value: formatQar(stats.revenue) },
          { label: "Orders", value: String(stats.orderCount) },
          { label: "Products", value: String(stats.productCount) },
          { label: "Customers", value: String(stats.customerCount) },
        ].map((card) => (
          <div key={card.label} style={{ background: "var(--surface)", padding: "1.25rem", border: "1px solid var(--sand)" }}>
            <p style={{ fontSize: "0.62rem", letterSpacing: "0.16em", textTransform: "uppercase", color: "var(--muted)" }}>{card.label}</p>
            <p style={{ fontSize: "1.4rem", fontWeight: 800, marginTop: "0.4rem" }}>{card.value}</p>
          </div>
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <section style={{ background: "var(--surface)", padding: "1.25rem", border: "1px solid var(--sand)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
            <h2 style={{ fontWeight: 800 }}>Recent orders</h2>
            <Link href="/admin/orders" style={{ color: "var(--gold)", fontSize: "0.75rem" }}>View all</Link>
          </div>
          {recent.map((order) => (
            <Link key={order.id} href={`/admin/orders/${order.id}`} style={{ display: "flex", justifyContent: "space-between", padding: "0.7rem 0", borderBottom: "1px solid var(--off-white)", textDecoration: "none", color: "inherit" }}>
              <span>{order.orderNumber}</span>
              <StatusBadge status={order.status} />
              <span>{formatQar(order.total)}</span>
            </Link>
          ))}
        </section>
        <section style={{ background: "var(--surface)", padding: "1.25rem", border: "1px solid var(--sand)" }}>
          <h2 style={{ fontWeight: 800, marginBottom: "1rem" }}>Low stock</h2>
          {lowStock.map((product) => (
            <Link key={product.id} href={`/admin/products/${product.id}`} style={{ display: "flex", justifyContent: "space-between", padding: "0.7rem 0", borderBottom: "1px solid var(--off-white)", textDecoration: "none", color: "inherit" }}>
              <span>{product.name}</span>
              <span style={{ color: product.stock <= 5 ? "var(--sale)" : "var(--muted)" }}>{product.stock} left</span>
            </Link>
          ))}
        </section>
      </div>
      <p style={{ marginTop: "1.5rem", color: "var(--muted)", fontSize: "0.8rem" }}>{stats.pendingOrders} pending · Updated {formatDate(new Date().toISOString())}</p>
    </div>
  );
}
