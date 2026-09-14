import { cookies } from "next/headers";
import Link from "next/link";
import { AreaChart, BarChart, DonutChart, Sparkline } from "@/components/admin/DashboardCharts";
import StatusBadge from "@/components/admin/StatusBadge";
import { getDashboardStats, listAllProducts, listOrders } from "@/lib/db";
import { formatDate, formatQar } from "@/lib/format";
import { translate } from "@/lib/i18n";
import { productIsLowStock, productStock } from "@/lib/products";
import { defaultLocale, type Locale } from "@/theme.config";
import type { OrderStatus } from "@/types";

export const metadata = { title: "Admin" };

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "#C9A96E",
  paid: "#3D8B5B",
  processing: "#D0893B",
  shipped: "#3B7CC9",
  delivered: "#2F6B4A",
  cancelled: "#C45B55",
};

function lastDays(count: number) {
  const days: Date[] = [];
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  for (let i = count - 1; i >= 0; i -= 1) {
    const day = new Date(now);
    day.setDate(now.getDate() - i);
    days.push(day);
  }
  return days;
}

export default async function AdminHomePage() {
  const store = await cookies();
  const locale = (store.get("qc_locale")?.value === "ar" ? "ar" : defaultLocale) as Locale;
  const t = (key: Parameters<typeof translate>[1], vars?: Record<string, string | number>) => translate(locale, key, vars);

  const [stats, orders, products] = await Promise.all([getDashboardStats(), listOrders(), listAllProducts()]);
  const recent = orders.slice(0, 6);
  const lowStock = products.filter((product) => productIsLowStock(product)).slice(0, 6);

  const days = lastDays(14);
  const revenuePoints = days.map((day) => {
    const key = day.toISOString().slice(0, 10);
    const value = orders
      .filter((order) => order.status !== "cancelled" && order.createdAt.slice(0, 10) === key)
      .reduce((sum, order) => sum + order.total, 0);
    return {
      label: day.toLocaleDateString(locale === "ar" ? "ar-QA" : "en-GB", { day: "numeric", month: "short" }),
      value,
    };
  });

  const statusSlices = (Object.keys(STATUS_COLORS) as OrderStatus[])
    .map((status) => ({
      label: status,
      value: orders.filter((order) => order.status === status).length,
      color: STATUS_COLORS[status],
    }))
    .filter((slice) => slice.value > 0);

  const inventory = Object.values(
    products.reduce<Record<string, { label: string; value: number }>>((acc, product) => {
      acc[product.category] ??= { label: product.category, value: 0 };
      acc[product.category].value += 1;
      return acc;
    }, {}),
  ).sort((a, b) => b.value - a.value);

  const cards = [
    { label: t("revenue"), value: formatQar(stats.revenue), hint: t("revenueTrend"), spark: revenuePoints.map((p) => p.value) },
    { label: t("ordersNav"), value: String(stats.orderCount), hint: t("pendingCount", { count: stats.pendingOrders }), spark: revenuePoints.map((p) => p.value) },
    { label: t("productsNav"), value: String(stats.productCount), hint: t("lowStockLabel"), spark: inventory.map((item) => item.value) },
    { label: t("customersNav"), value: String(stats.customerCount), hint: t("healthy"), spark: [stats.customerCount] },
  ];

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">{t("admin")}</p>
          <h1 className="admin-title">{t("dashboard")}</h1>
        </div>
        <p className="admin-updated">{t("updatedOn", { date: formatDate(new Date().toISOString(), locale) })}</p>
      </div>

      <div className="admin-stat-grid">
        {cards.map((card) => (
          <article key={card.label} className="admin-stat">
            <div className="admin-stat__top">
              <p>{card.label}</p>
              <Sparkline values={card.spark.length ? card.spark : [0]} />
            </div>
            <strong>{card.value}</strong>
            <span>{card.hint}</span>
          </article>
        ))}
      </div>

      <div className="admin-chart-grid">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>{t("revenueTrend")}</h2>
          </div>
          <AreaChart points={revenuePoints} empty={t("noChartData")} />
        </section>
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>{orders.length ? t("orderStatus") : t("inventoryMix")}</h2>
          </div>
          {orders.length ? (
            <DonutChart slices={statusSlices} empty={t("noChartData")} />
          ) : (
            <BarChart bars={inventory} />
          )}
        </section>
      </div>

      <div className="admin-split">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>{t("recentOrders")}</h2>
            <Link href="/admin/orders">{t("viewAll")}</Link>
          </div>
          {recent.length === 0 ? (
            <p className="admin-empty">{t("noOrders")}</p>
          ) : (
            <div className="admin-order-list">
              {recent.map((order) => (
                <Link key={order.id} href={`/admin/orders/${order.id}`} className="admin-order-row">
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <span>{order.customerName}</span>
                  </div>
                  <StatusBadge status={order.status} />
                  <em>{formatDate(order.createdAt, locale)}</em>
                  <b>{formatQar(order.total)}</b>
                </Link>
              ))}
            </div>
          )}
        </section>
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>{t("lowStockLabel")}</h2>
            <Link href="/admin/products">{t("viewAll")}</Link>
          </div>
          {lowStock.length === 0 ? (
            <p className="admin-empty">{t("noLowStock")}</p>
          ) : (
            <div className="admin-order-list">
              {lowStock.map((product) => (
                <Link key={product.id} href={`/admin/products/${product.id}`} className="admin-order-row admin-order-row--stock">
                  <div>
                    <strong>{product.name}</strong>
                    <span>{product.sku}</span>
                  </div>
                  <b className={productStock(product) <= 5 ? "is-critical" : "is-warn"}>{t("leftInStock", { count: productStock(product) })}</b>
                </Link>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
