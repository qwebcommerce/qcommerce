"use client";

import { useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import TopBar from "@/components/TopBar";
import { loginAdminAction } from "@/lib/actions";
import { usePreferences } from "@/lib/preferences";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const { t } = usePreferences();

  return (
    <main style={{ minHeight: "100vh", background: "var(--black)" }}>
      <TopBar compact />
      <div style={{ minHeight: "calc(100vh - 36px)", display: "grid", placeItems: "center", padding: "2rem" }}>
        <form
          action={async (formData) => {
            const result = await loginAdminAction(formData);
            if (result?.error) setError(result.error);
          }}
          style={{ width: "min(400px, 100%)", background: "var(--warm-white)", color: "var(--black)", padding: "2.5rem", display: "flex", flexDirection: "column", gap: "1.1rem" }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <BrandLogo size="footer" />
          </div>
          <h1 style={{ fontSize: "1.2rem", fontWeight: 800, textAlign: "center", letterSpacing: "0.12em" }}>{t("admin")}</h1>
          <input name="email" type="email" required defaultValue="admin@voombaza.com" className="field-input" placeholder={t("email")} />
          <input name="password" type="password" required className="field-input" placeholder={t("password")} />
          {error && <p style={{ color: "var(--sale)", fontSize: "0.85rem" }}>{error}</p>}
          <button className="btn-gold">{t("signIn")}</button>
        </form>
      </div>
    </main>
  );
}
