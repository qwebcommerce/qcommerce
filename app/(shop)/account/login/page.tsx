"use client";

import Link from "next/link";
import { Suspense, useState } from "react";
import { useSearchParams } from "next/navigation";
import { loginCustomerAction } from "@/lib/actions";
import { usePreferences } from "@/lib/preferences";

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

function LoginForm() {
  const [error, setError] = useState("");
  const { t } = usePreferences();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const registerHref = next ? `/account/register?next=${encodeURIComponent(next)}` : "/account/register";

  return (
    <section className="page-section" style={{ maxWidth: 480 }}>
      <span className="section-eyebrow">{t("account")}</span>
      <h1 className="section-title" style={{ marginBottom: "2rem" }}>{t("login")}</h1>
      <form
        action={async (formData) => {
          const result = await loginCustomerAction(formData);
          if (result?.error) setError(result.error);
        }}
        style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}
      >
        <input type="hidden" name="next" value={next} />
        <input name="email" type="email" required placeholder={t("email")} className="field-input" />
        <input name="password" type="password" required placeholder={t("password")} className="field-input" />
        {error && <p style={{ color: "var(--sale)" }}>{error}</p>}
        <button className="btn-gold">{t("signIn")}</button>
      </form>
      <p style={{ marginTop: "1.5rem", color: "var(--muted)", fontSize: "0.9rem" }}>
        {t("newHere")} <Link href={registerHref} style={{ color: "var(--gold)" }}>{t("createAccount")}</Link>
      </p>
    </section>
  );
}
