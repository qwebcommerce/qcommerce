"use client";

import { useCommerceSettings } from "@/lib/commerce-settings";
import { usePreferences } from "@/lib/preferences";
import { theme } from "@/theme.config";

export default function TrustBadges() {
  const { t } = usePreferences();
  const { freeShippingFrom, returnDays } = useCommerceSettings();
  const badges = [
    { title: t("trustShipping"), sub: t("trustShippingSub", { currency: theme.commerce.currency, amount: freeShippingFrom }) },
    { title: t("trustReturns"), sub: t("trustReturnsSub", { days: returnDays }) },
    { title: t("trustPayment"), sub: t("trustPaymentSub") },
    { title: t("trustQuality"), sub: t("trustQualitySub") },
  ];

  return (
    <section style={{ backgroundColor: "var(--off-white)", borderBottom: "1px solid var(--sand)" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "0 1.5rem" }}>
        <div className="grid grid-cols-2 md:grid-cols-4">
          {badges.map((badge, i) => (
            <div
              key={badge.title}
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                textAlign: "center",
                padding: "2.2rem 1.5rem",
                borderInlineEnd: i < badges.length - 1 ? "1px solid var(--sand)" : "none",
                gap: "0.75rem",
              }}
            >
              <p style={{ fontWeight: 700, fontSize: "0.82rem", letterSpacing: "0.06em", color: "var(--black)" }}>{badge.title}</p>
              <p style={{ fontSize: "0.72rem", color: "var(--muted)" }}>{badge.sub}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
