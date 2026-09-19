"use client";

import Link from "next/link";
import { formatDate, formatQar } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import type { Order } from "@/types";

export default function OrderView({ order, placed }: { order: Order; placed?: boolean }) {
  const { t, locale } = usePreferences();
  return (
    <div>
      <header className="account-dash__head">
        <div>
          <span className="section-eyebrow">{t("order")}</span>
          <h1 className="section-title">{order.orderNumber}</h1>
          <p className="account-dash__hello">
            {formatDate(order.createdAt, locale)} ·{" "}
            <span className={`status-pill status-pill--${order.status}`}>{order.status}</span>
          </p>
        </div>
        <Link href="/account/orders" className="account-back">
          {t("backToDashboard")}
        </Link>
      </header>

      {placed ? <p className="account-order-thanks">{t("thankYou")}</p> : null}

      <div className="account-dash">
        <section className="account-card">
          <h2>{t("items")}</h2>
          <div className="account-orders">
            {order.items.map((item) => (
              <div key={`${item.productId}-${item.size}-${item.color}`} className="account-order">
                <div>
                  <strong>
                    <Link href={`/product/${item.slug}`}>{item.name}</Link>
                  </strong>
                  <span>
                    {[item.size, item.color].filter(Boolean).join(" · ")} × {item.quantity}
                  </span>
                </div>
                <em>{formatQar(item.price * item.quantity)}</em>
              </div>
            ))}
          </div>
          <div className="account-order-totals">
            <p>
              <span>{t("shipping")}</span>
              <span>{order.shipping === 0 ? t("free") : formatQar(order.shipping)}</span>
            </p>
            {order.discount > 0 ? (
              <p>
                <span>
                  {t("discount")}
                  {order.promoCode ? ` · ${order.promoCode}` : ""}
                </span>
                <span>−{formatQar(order.discount)}</span>
              </p>
            ) : null}
            <p className="account-order-totals__grand">
              <span>{t("total")}</span>
              <span>{formatQar(order.total)}</span>
            </p>
          </div>
        </section>

        <section className="account-card">
          <h2>{t("shipTo")}</h2>
          <p className="account-ship-block">
            <strong>{order.customerName}</strong>
            <span>
              {[
                order.shippingAddress.line1,
                order.shippingAddress.area,
                order.shippingAddress.city,
                order.shippingAddress.postalCode,
                order.shippingAddress.country,
              ]
                .filter(Boolean)
                .join(", ")}
            </span>
            <span>
              {t("paymentMethod")}: {t("cashOnDelivery")}
            </span>
          </p>
        </section>
      </div>
    </div>
  );
}
