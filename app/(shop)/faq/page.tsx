"use client";

import { usePreferences } from "@/lib/preferences";
import { loc, theme } from "@/theme.config";

export default function FaqPage() {
  const { t, locale } = usePreferences();
  return (
    <section className="page-section" style={{ maxWidth: 800 }}>
      <span className="section-eyebrow">{t("help")}</span>
      <h1 className="section-title" style={{ marginBottom: "2rem" }}>{t("faqTitle")}</h1>
      {theme.faqs.map((item) => (
        <details key={loc(item.q, "en")} className="faq-item">
          <summary>{loc(item.q, locale)} <span>+</span></summary>
          <div style={{ paddingTop: "1rem", color: "var(--muted)", lineHeight: 1.8, fontSize: "0.9rem" }}>{loc(item.a, locale)}</div>
        </details>
      ))}
    </section>
  );
}
