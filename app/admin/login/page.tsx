"use client";

import { useState } from "react";
import Link from "next/link";
import BrandLogo from "@/components/BrandLogo";
import TopBar from "@/components/TopBar";
import { loginAdminAction } from "@/lib/actions";
import { usePreferences } from "@/lib/preferences";

export default function AdminLoginPage() {
  const [error, setError] = useState("");
  const { t } = usePreferences();

  return (
    <main className="admin-login">
      <TopBar compact />
      <div className="admin-login__stage">
        <form
          className="admin-login__card"
          action={async (formData) => {
            const result = await loginAdminAction(formData);
            if (result?.error) setError(result.error);
          }}
        >
          <Link href="/" className="admin-login__brand" title={t("backToHomepage")}>
            <BrandLogo size="footer" />
          </Link>
          <p className="admin-kicker">{t("admin")}</p>
          <h1 className="admin-login__title">{t("signIn")}</h1>
          <p className="admin-login__lead">{t("adminLoginLead")}</p>
          <label>
            <span className="admin-label">{t("email")}</span>
            <input name="email" type="email" required defaultValue="admin@voombaza.com" className="admin-input" autoComplete="username" />
          </label>
          <label>
            <span className="admin-label">{t("password")}</span>
            <input name="password" type="password" required className="admin-input" placeholder={t("password")} autoComplete="current-password" />
          </label>
          {error ? <p className="admin-login__error">{error}</p> : null}
          <button className="btn-gold" type="submit">
            {t("signIn")}
          </button>
          <Link href="/" className="admin-login__home">
            <HomeIcon />
            {t("backToHomepage")}
          </Link>
        </form>
      </div>
    </main>
  );
}

function HomeIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 11.2 12 4.8l7.5 6.4v8.3a1.5 1.5 0 0 1-1.5 1.5h-4.2v-5.2h-3.6v5.2H6a1.5 1.5 0 0 1-1.5-1.5v-8.3Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}
