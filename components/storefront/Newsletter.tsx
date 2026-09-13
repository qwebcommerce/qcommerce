"use client";

import { useState } from "react";
import { subscribeNewsletterAction } from "@/lib/actions";
import { usePreferences } from "@/lib/preferences";

export default function Newsletter() {
  const { t } = usePreferences();
  const [done, setDone] = useState(false);

  return (
    <section style={{ backgroundColor: "var(--warm-white)", padding: "8rem 1.5rem", borderTop: "1px solid var(--sand)" }}>
      <div style={{ maxWidth: "680px", margin: "0 auto", textAlign: "center" }}>
        <div style={{ width: "40px", height: "1px", backgroundColor: "var(--gold)", margin: "0 auto 2rem" }} />
        <span className="section-eyebrow" style={{ display: "block", textAlign: "center" }}>{t("exclusiveAccess")}</span>
        <h2 style={{ color: "var(--black)", fontSize: "clamp(2.2rem, 6vw, 4.2rem)", fontWeight: 900, letterSpacing: "-0.02em", lineHeight: 0.92, textTransform: "uppercase", marginBottom: "1.5rem" }}>
          {t("joinThe")}<br />
          <span style={{ color: "transparent", WebkitTextStroke: "1px var(--gold)" }}>{t("movement")}</span>
        </h2>
        <p style={{ color: "var(--muted)", fontSize: "0.95rem", lineHeight: 1.8, marginBottom: "3rem" }}>
          {t("newsletterBody")}
        </p>
        {done ? (
          <p style={{ color: "var(--black)", letterSpacing: "0.08em" }}>{t("newsletterSuccess")}</p>
        ) : (
          <form
            action={async (formData) => {
              const result = await subscribeNewsletterAction(formData);
              if (result?.ok) setDone(true);
            }}
            style={{ maxWidth: "440px", margin: "0 auto" }}
          >
            <input type="email" name="email" required placeholder={t("emailPlaceholder")} className="nl-input" style={{ marginBottom: "1.25rem" }} />
            <button type="submit" className="btn-gold" style={{ width: "100%" }}>{t("subscribe")}</button>
          </form>
        )}
      </div>
    </section>
  );
}
