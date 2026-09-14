"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { logoutAdminAction } from "@/lib/actions";
import { useCommerceSettings } from "@/lib/commerce-settings";
import { promoIsActive } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { theme } from "@/theme.config";

export default function TopBar({
  compact = false,
  adminEmail,
}: {
  compact?: boolean;
  adminEmail?: string | null;
}) {
  const { locale, theme: mode, setLocale, setTheme, t } = usePreferences();
  const settings = useCommerceSettings();
  const [scrolled, setScrolled] = useState(false);
  const announcement = [
    t("announceShipping", { currency: theme.commerce.currency, amount: settings.freeShippingFrom }),
    t("announceReturns", { days: settings.returnDays }),
    promoIsActive(settings)
      ? t("announcePromo", { code: settings.promoCode, percent: settings.promoPercent })
      : "",
  ]
    .filter(Boolean)
    .join(" · ");

  useEffect(() => {
    if (!compact) return;
    const sync = () => setScrolled(window.scrollY > 8);
    sync();
    window.addEventListener("scroll", sync, { passive: true });
    return () => window.removeEventListener("scroll", sync);
  }, [compact]);

  const languageToggle = (
    <div className={`pref-toggle${locale === "ar" ? " is-on" : ""}`} dir="ltr" role="group" aria-label={t("language")}>
      <span className="pref-toggle__glow" aria-hidden="true" />
      <span className="pref-toggle__thumb" aria-hidden="true" />
      <button
        type="button"
        className={`pref-toggle__opt${locale === "en" ? " is-active" : ""}`}
        onClick={() => setLocale("en")}
        aria-pressed={locale === "en"}
      >
        EN
      </button>
      <button
        type="button"
        className={`pref-toggle__opt${locale === "ar" ? " is-active" : ""}`}
        onClick={() => setLocale("ar")}
        aria-pressed={locale === "ar"}
      >
        AR
      </button>
    </div>
  );

  const themeToggle = (
    <div
      className={`pref-toggle pref-toggle--theme${mode === "dark" ? " is-on" : ""}`}
      dir="ltr"
      role="group"
      aria-label={t("theme")}
    >
      <span className="pref-toggle__glow" aria-hidden="true" />
      <span className="pref-toggle__thumb" aria-hidden="true" />
      <button
        type="button"
        className={`pref-toggle__opt${mode === "light" ? " is-active" : ""}`}
        onClick={() => setTheme("light")}
        aria-pressed={mode === "light"}
        aria-label={t("light")}
        title={t("light")}
      >
        <SunIcon />
      </button>
      <button
        type="button"
        className={`pref-toggle__opt${mode === "dark" ? " is-active" : ""}`}
        onClick={() => setTheme("dark")}
        aria-pressed={mode === "dark"}
        aria-label={t("dark")}
        title={t("dark")}
      >
        <MoonIcon />
      </button>
    </div>
  );

  if (compact) {
    return (
      <div className={`topbar topbar--admin${scrolled ? " is-scrolled" : ""}`}>
        {adminEmail ? <AdminProductSearch /> : null}
        <div className="topbar-switches" dir="ltr">
          {languageToggle}
          {themeToggle}
          {adminEmail ? <AdminAvatar email={adminEmail} /> : null}
        </div>
      </div>
    );
  }

  return (
    <div className="topbar">
      {languageToggle}
      <p style={{ textAlign: "center", margin: 0 }} className="hidden md:block">
        {announcement}
      </p>
      <div style={{ justifySelf: "end" }}>{themeToggle}</div>
    </div>
  );
}

function AdminProductSearch() {
  const { t } = usePreferences();
  const router = useRouter();
  const [query, setQuery] = useState("");

  function go(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const next = query.trim();
    router.push(next ? `/admin/products?q=${encodeURIComponent(next)}` : "/admin/products");
  }

  return (
    <form className="admin-top-search" onSubmit={go} role="search">
      <input
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t("productSearch")}
        aria-label={t("productSearch")}
      />
      <button type="submit" aria-label={t("search")}>
        <SearchIcon />
      </button>
    </form>
  );
}

function AdminAvatar({ email }: { email: string }) {
  const { t } = usePreferences();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const initial = (email.trim()[0] || "A").toUpperCase();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div className="admin-avatar" ref={root}>
      <button
        type="button"
        className="admin-avatar__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        title={email}
      >
        {initial}
      </button>
      {open ? (
        <div className="admin-avatar__menu" role="menu">
          <p className="admin-avatar__email">{email}</p>
          <Link href="/admin" role="menuitem" onClick={() => setOpen(false)}>
            {t("dashboard")}
          </Link>
          <form action={logoutAdminAction}>
            <button type="submit" role="menuitem">
              {t("logOut")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.5" stroke="currentColor" strokeWidth="1.7" />
      <path d="M12 2.8v2.1M12 19.1v2.1M2.8 12h2.1M19.1 12h2.1M5.4 5.4l1.5 1.5M17.1 17.1l1.5 1.5M5.4 18.6l1.5-1.5M17.1 6.9l1.5-1.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M17.2 14.4A6.6 6.6 0 0 1 9.6 6.8 5.9 5.9 0 1 0 17.2 14.4Z" stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.8" />
      <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}
