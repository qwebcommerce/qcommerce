"use client";

import Link from "next/link";
import { Suspense, useState, type FormEvent } from "react";
import { useSearchParams } from "next/navigation";
import { registerCustomerAction } from "@/lib/actions";
import type { MessageKey } from "@/lib/i18n";
import { usePreferences } from "@/lib/preferences";

export default function RegisterPage() {
  return (
    <Suspense>
      <RegisterForm />
    </Suspense>
  );
}

function RegisterForm() {
  const [error, setError] = useState<MessageKey | "">("");
  const [pending, setPending] = useState(false);
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { t } = usePreferences();
  const searchParams = useSearchParams();
  const next = searchParams.get("next") ?? "";
  const loginHref = next ? `/account/login?next=${encodeURIComponent(next)}` : "/account/login";

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    setPending(true);
    const formData = new FormData(event.currentTarget);
    const result = await registerCustomerAction(formData);
    setPending(false);
    if (result?.error) setError(result.error);
  }

  return (
    <section className="page-section" style={{ maxWidth: 480 }}>
      <span className="section-eyebrow">{t("account")}</span>
      <h1 className="section-title" style={{ marginBottom: "2rem" }}>{t("createAccount")}</h1>
      <form onSubmit={onSubmit} style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
        <input type="hidden" name="next" value={next} />
        <input
          name="fullName"
          required
          placeholder={t("fullName")}
          className="field-input"
          autoComplete="name"
          value={fullName}
          onChange={(event) => setFullName(event.target.value)}
        />
        <input
          name="email"
          type="email"
          required
          placeholder={t("email")}
          className="field-input"
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          name="password"
          type="password"
          required
          placeholder={t("password")}
          className="field-input"
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        {error ? <p style={{ color: "var(--sale)" }}>{t(error)}</p> : null}
        <button className="btn-gold" disabled={pending}>
          {pending ? t("creatingAccount") : t("createAccount")}
        </button>
      </form>
      <p style={{ marginTop: "1.5rem", color: "var(--muted)", fontSize: "0.9rem" }}>
        {t("alreadyHaveAccount")} <Link href={loginHref} style={{ color: "var(--gold)" }}>{t("login")}</Link>
      </p>
    </section>
  );
}
