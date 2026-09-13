"use client";

import { usePreferences } from "@/lib/preferences";
import { loc, theme } from "@/theme.config";

export default function TopBar({ compact = false }: { compact?: boolean }) {
  const { locale, theme: mode, setLocale, setTheme, t } = usePreferences();
  const announcement = loc(theme.announcement, locale)
    .replace("{amount}", String(theme.commerce.freeShippingFrom))
    .replace("{code}", theme.commerce.promoCode)
    .replace("{percent}", String(theme.commerce.promoPercent));

  return (
    <div
      className="topbar"
      style={{
        backgroundColor: "var(--gold)",
        color: "#0D0D0D",
        display: "grid",
        gridTemplateColumns: compact ? "1fr auto" : "auto 1fr auto",
        alignItems: "center",
        gap: "0.85rem",
        padding: "0.4rem 1.25rem",
        fontSize: "0.62rem",
        letterSpacing: "0.12em",
        textTransform: "uppercase",
      }}
    >
      <div className={`pref-toggle${locale === "ar" ? " is-on" : ""}`} dir="ltr">
        <span className="pref-toggle__thumb" aria-hidden="true" />
        <button
          type="button"
          className={`pref-toggle__opt${locale === "en" ? " is-active" : ""}`}
          onClick={() => setLocale("en")}
          aria-pressed={locale === "en"}
          aria-label={`${t("language")} EN`}
        >
          EN
        </button>
        <button
          type="button"
          className={`pref-toggle__opt${locale === "ar" ? " is-active" : ""}`}
          onClick={() => setLocale("ar")}
          aria-pressed={locale === "ar"}
          aria-label={`${t("language")} AR`}
        >
          عربي
        </button>
      </div>

      {!compact && (
        <p style={{ textAlign: "center", margin: 0 }} className="hidden md:block">
          {announcement}
        </p>
      )}

      <button
        type="button"
        className={`pref-toggle pref-toggle--theme${mode === "dark" ? " is-on" : ""}`}
        dir="ltr"
        onClick={() => setTheme(mode === "dark" ? "light" : "dark")}
        aria-label={t("theme")}
        aria-pressed={mode === "dark"}
        style={{ justifySelf: "end" }}
      >
        <span className="pref-toggle__thumb" aria-hidden="true" />
        <span className={`pref-toggle__opt${mode === "light" ? " is-active" : ""}`}>
          <SunIcon />
          <span>{t("light")}</span>
        </span>
        <span className={`pref-toggle__opt${mode === "dark" ? " is-active" : ""}`}>
          <MoonIcon />
          <span>{t("dark")}</span>
        </span>
      </button>
    </div>
  );
}

function SunIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.4" stroke="currentColor" strokeWidth="1.8" />
      <path d="M12 3v2.2M12 18.8V21M3 12h2.2M18.8 12H21M5.6 5.6l1.6 1.6M16.8 16.8l1.6 1.6M5.6 18.4l1.6-1.6M16.8 7.2l1.6-1.6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="10" height="10" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M16.8 14.2A6.4 6.4 0 0 1 9.8 7.2 5.7 5.7 0 1 0 16.8 14.2Z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  );
}
