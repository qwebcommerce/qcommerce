"use client";

import Link from "next/link";
import { formatDate, formatQar } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import type { Order } from "@/types";

export default function OrderView({ order, placed }: { order: Order; placed?: boolean }) {
  const { t } = usePreferences();
  return (
    <section className="page-section">
      {placed && (
        <p style={{ color: "var(--gold)", marginBottom: "1rem", letterSpacing: "0.08em" }}>
          {t("thankYou")}
        </p>
      )}
      <span className="section-eyebrow">{t("order")}</span>
      <h1 className="section-title" style={{ marginBottom: "1rem" }}>{order.orderNumber}</h1>
      <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>
        {formatDate(order.createdAt)} · <span style={{ textTransform: "capitalize" }}>{order.status}</span>
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem", marginBottom: "2rem" }}>
        {order.items.map((item) => (
          <div key={`${item.productId}-${item.size}-${item.color}`} style={{ display: "flex", justifyContent: "space-between", gap: "1rem", borderBottom: "1px solid var(--sand)", paddingBottom: "1rem" }}>
            <div>
              <Link href={`/product/${item.slug}`} style={{ fontWeight: 700, textDecoration: "none", color: "inherit" }}>{item.name}</Link>
              <p style={{ color: "var(--muted)", fontSize: "0.8rem" }}>{[item.size, item.color].filter(Boolean).join(" · ")} × {item.quantity}</p>
            </div>
            <strong>{formatQar(item.price * item.quantity)}</strong>
          </div>
        ))}
      </div>
      <p style={{ display: "flex", justifyContent: "space-between" }}><span>{t("shipping")}</span><span>{order.shipping === 0 ? t("free") : formatQar(order.shipping)}</span></p>
      <p style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, margin: "0.75rem 0 2rem" }}><span>{t("total")}</span><span>{formatQar(order.total)}</span></p>
      <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>
        {t("shipTo")} {order.customerName}, {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.country}
      </p>
    </section>
  );
}
