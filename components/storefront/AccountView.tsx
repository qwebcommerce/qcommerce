"use client";

import Link from "next/link";
import { logoutCustomerAction } from "@/lib/actions";
import { formatDate, formatQar } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import type { Order } from "@/types";

export default function AccountView({
  name,
  orders,
}: {
  name: string;
  orders: Order[];
}) {
  const { t } = usePreferences();
  return (
    <section className="page-section">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" }}>
        <h1 className="section-title">{t("myAccount")}</h1>
        <form action={logoutCustomerAction}>
          <button className="btn-outline-black">{t("logOut")}</button>
        </form>
      </div>
      <p style={{ marginBottom: "2rem" }}>{t("hello", { name })}</p>
      <h2 style={{ fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", marginBottom: "1rem" }}>{t("orderHistory")}</h2>
      {orders.length === 0 ? (
        <p style={{ color: "var(--muted)" }}>{t("noOrders")}</p>
      ) : (
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.85rem" }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--sand)", textAlign: "start" }}>
              <th style={{ padding: "0.75rem 0" }}>{t("order")}</th>
              <th>{t("date")}</th>
              <th>{t("status")}</th>
              <th>{t("total")}</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} style={{ borderBottom: "1px solid var(--sand)" }}>
                <td style={{ padding: "0.75rem 0" }}>
                  <Link href={`/account/orders/${order.id}`}>{order.orderNumber}</Link>
                </td>
                <td>{formatDate(order.createdAt)}</td>
                <td style={{ textTransform: "capitalize" }}>{order.status}</td>
                <td>{formatQar(order.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
