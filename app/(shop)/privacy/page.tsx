"use client";

import { usePreferences } from "@/lib/preferences";
import { loc, theme } from "@/theme.config";

export default function PrivacyPage() {
  const { t, locale } = usePreferences();
  return (
    <section className="page-section">
      <span className="section-eyebrow">{t("legal")}</span>
      <h1 className="section-title" style={{ marginBottom: "1.5rem" }}>{t("privacy")}</h1>
      <p style={{ color: "var(--muted)", lineHeight: 1.85 }}>
        {loc(theme.pages.privacy, locale)}
      </p>
    </section>
  );
}
