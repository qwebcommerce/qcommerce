"use client";

import Link from "next/link";
import { usePreferences } from "@/lib/preferences";
import { loc, theme } from "@/theme.config";

export default function Footer() {
  const { t, locale } = usePreferences();
  const cols = {
    [t("shop")]: [
      { label: t("men"), href: "/shop" },
      { label: t("women"), href: "/shop" },
      { label: t("newArrivals"), href: "/shop/new-arrivals" },
      { label: t("collections"), href: "/shop" },
      { label: t("sale"), href: "/shop?sort=price-asc" },
    ],
    [t("support")]: [
      { label: t("trackOrder"), href: "/account" },
      { label: t("returns"), href: "/faq" },
      { label: t("shippingInfo"), href: "/faq" },
      { label: t("contactUs"), href: "/contact" },
      { label: t("faqs"), href: "/faq" },
    ],
    [t("company")]: [
      { label: t("aboutBrand", { brand: theme.brand.display }), href: "/about" },
      { label: t("press"), href: "/about" },
      { label: t("admin"), href: "/admin" },
    ],
  };

  return (
    <footer style={{ backgroundColor: "var(--footer)", borderTop: "1px solid rgba(201,169,110,0.1)" }}>
      <div style={{ borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "1.5rem 2rem" }}>
        <div style={{ maxWidth: "1400px", margin: "0 auto", display: "flex", alignItems: "center", gap: "1.5rem", flexWrap: "wrap", justifyContent: "center" }}>
          <span style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.62rem", letterSpacing: "0.25em", textTransform: "uppercase" }}>{t("shipsTo")}</span>
          {theme.commerce.countries.map((c) => (
            <span key={c} style={{ color: "rgba(255,255,255,0.55)", fontSize: "0.72rem" }}>{c}</span>
          ))}
        </div>
      </div>

      <div style={{ maxWidth: "1400px", margin: "0 auto", padding: "5rem 2rem 3rem" }}>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-12 mb-16">
          <div>
            <Link href="/" style={{ color: "#fff", fontSize: "1.5rem", fontWeight: 900, letterSpacing: "0.28em", textDecoration: "none", display: "block", marginBottom: "1.5rem" }}>
              <span dir="ltr">{theme.brand.name}</span>
            </Link>
            <p style={{ color: "rgba(255,255,255,0.35)", fontSize: "0.83rem", lineHeight: 1.8, marginBottom: "2rem" }}>
              {loc(theme.brand.description, locale)}
            </p>
            <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
              {theme.commerce.payments.map((p) => (
                <span key={p} style={{ border: "1px solid rgba(255,255,255,0.12)", color: "rgba(255,255,255,0.35)", fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.08em", padding: "0.3rem 0.55rem" }}>
                  {p}
                </span>
              ))}
            </div>
          </div>

          {Object.entries(cols).map(([heading, links]) => (
            <div key={heading}>
              <p style={{ color: "var(--gold)", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: "1.75rem" }}>
                {heading}
              </p>
              <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "0.9rem" }}>
                {links.map((link) => (
                  <li key={link.label}>
                    <Link href={link.href} className="footer-link">{link.label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "2rem", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "1rem" }}>
          <p style={{ color: "rgba(255,255,255,0.22)", fontSize: "0.72rem" }}>
            {t("copyright", { year: new Date().getFullYear(), brand: theme.brand.display, currency: theme.commerce.currency })}
          </p>
          <div style={{ display: "flex", gap: "2rem", flexWrap: "wrap" }}>
            <Link href="/privacy" className="footer-legal-link">{t("privacyLink")}</Link>
            <Link href="/terms" className="footer-legal-link">{t("termsLink")}</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
