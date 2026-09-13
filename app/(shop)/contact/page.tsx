"use client";

import { useState } from "react";
import { usePreferences } from "@/lib/preferences";

export default function ContactPage() {
  const [done, setDone] = useState(false);
  const { t } = usePreferences();

  return (
    <section className="page-section" style={{ maxWidth: 700 }}>
      <span className="section-eyebrow">{t("getInTouch")}</span>
      <h1 className="section-title" style={{ marginBottom: "1rem" }}>{t("contactTitle")}</h1>
      <p style={{ color: "var(--muted)", marginBottom: "2.5rem" }}>{t("contactSubtitle")}</p>
      {done ? (
        <p>{t("contactSuccess")}</p>
      ) : (
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setDone(true);
          }}
          style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
        >
          <input required placeholder={t("fullName")} className="field-input" />
          <input required type="email" placeholder={t("email")} className="field-input" />
          <input placeholder={t("phoneOptional")} className="field-input" />
          <textarea required minLength={10} placeholder={t("message")} className="admin-textarea" rows={5} />
          <button className="btn-gold">{t("sendMessage")}</button>
        </form>
      )}
    </section>
  );
}
