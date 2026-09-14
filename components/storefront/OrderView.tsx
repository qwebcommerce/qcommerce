"use client";

import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { formatDate, formatQar } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import type { Order } from "@/types";

export default function OrderView({ order, placed }: { order: Order; placed?: boolean }) {
  const { t, locale } = usePreferences();
  return (
    <div>
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">{t("order")}</p>
          <h1 className="admin-title">{order.orderNumber}</h1>
        </div>
        <p className="admin-updated">
          {formatDate(order.createdAt, locale)} · <StatusBadge status={order.status} />
        </p>
      </div>

      {placed ? (
        <p className="account-order-thanks">{t("thankYou")}</p>
      ) : null}

      <div className="admin-split">
        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>{t("items")}</h2>
          </div>
          <div className="admin-order-list">
            {order.items.map((item) => (
              <div key={`${item.productId}-${item.size}-${item.color}`} className="admin-order-row admin-order-row--stock">
                <div>
                  <strong>
                    <Link href={`/product/${item.slug}`}>{item.name}</Link>
                  </strong>
                  <span>
                    {[item.size, item.color].filter(Boolean).join(" · ")} × {item.quantity}
                  </span>
                </div>
                <b>{formatQar(item.price * item.quantity)}</b>
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

        <section className="admin-panel">
          <div className="admin-panel__head">
            <h2>{t("yourProfile")}</h2>
          </div>
          <p className="account-ship-block">
            <strong>{order.customerName}</strong>
            <span>
              {t("shipTo")} {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.country}
            </span>
            <span>
              {t("paymentMethod")}: {t("cashOnDelivery")}
            </span>
          </p>
          <Link href="/account" className="account-back">
            {t("backToDashboard")}
          </Link>
        </section>
      </div>
    </div>
  );
}
