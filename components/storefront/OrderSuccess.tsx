"use client";

import Link from "next/link";
import { usePreferences } from "@/lib/preferences";

export default function OrderSuccess({
  orderNumber,
  signedIn,
}: {
  orderNumber: string;
  signedIn: boolean;
}) {
  const { t } = usePreferences();

  return (
    <section className="page-section">
      <div className="order-success">
        <div className="order-success__mark" aria-hidden="true">✓</div>
        <span className="section-eyebrow">{t("order")}</span>
        <h1 className="section-title">{t("orderCongrats")}</h1>
        <p className="order-success__number">
          {t("orderNumberLabel")}
          <strong>{orderNumber}</strong>
        </p>
        <p className="order-success__body">{t("orderCongratsBody")}</p>
        <p className="order-success__note">{t("contactedShortly")}</p>
        <div className="order-success__actions">
          <Link href="/shop" className="btn-gold">{t("continueShopping")}</Link>
          {signedIn ? (
            <Link href="/account" className="btn-outline-black">{t("viewYourOrders")}</Link>
          ) : null}
        </div>
      </div>
    </section>
  );
}
