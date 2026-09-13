"use client";

import { usePreferences } from "@/lib/preferences";
import { loc, theme } from "@/theme.config";

export default function AboutPage() {
  const { t, locale } = usePreferences();
  return (
    <section className="page-section" style={{ maxWidth: 760 }}>
      <span className="section-eyebrow">{t("ourStory")}</span>
      <h1 className="section-title" style={{ marginBottom: "1.5rem" }}>{t("aboutBrand", { brand: theme.brand.name })}</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.9, fontSize: "1.05rem" }}>
        {loc(theme.pages.about, locale)}
      </p>
    </section>
  );
}
