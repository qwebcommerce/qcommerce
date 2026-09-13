"use client";

import { createContext, useContext, useMemo, useRef, useSyncExternalStore } from "react";
import { translate, type MessageKey } from "@/lib/i18n";
import { defaultLocale, defaultThemeMode, type Locale } from "@/theme.config";

export type ThemeMode = "light" | "dark";

type Snapshot = { locale: Locale; theme: ThemeMode };

type Preferences = {
  locale: Locale;
  theme: ThemeMode;
  dir: "ltr" | "rtl";
  setLocale: (locale: Locale) => void;
  setTheme: (theme: ThemeMode) => void;
  t: (key: MessageKey, vars?: Record<string, string | number>) => string;
};

const PreferencesContext = createContext<Preferences | null>(null);

function writeCookie(name: string, value: string) {
  document.cookie = `${name}=${value}; path=/; max-age=31536000; samesite=lax`;
}

function applyDom(locale: Locale, theme: ThemeMode) {
  document.documentElement.lang = locale;
  document.documentElement.dir = locale === "ar" ? "rtl" : "ltr";
  document.documentElement.dataset.theme = theme;
  document.documentElement.classList.toggle("dark", theme === "dark");
}

const listeners = new Set<() => void>();
let memory: Snapshot = { locale: defaultLocale, theme: defaultThemeMode };

function emit() {
  listeners.forEach((listener) => listener());
}

function same(a: Snapshot, b: Snapshot) {
  return a.locale === b.locale && a.theme === b.theme;
}

function setMemory(next: Snapshot) {
  if (same(memory, next)) return memory;
  memory = next;
  return memory;
}

function persist(next: Snapshot) {
  setMemory(next);
  localStorage.setItem("qc_locale", next.locale);
  localStorage.setItem("qc_theme", next.theme);
  writeCookie("qc_locale", next.locale);
  writeCookie("qc_theme", next.theme);
  applyDom(next.locale, next.theme);
  emit();
}

function read(): Snapshot {
  if (typeof window === "undefined") return memory;
  const locale = localStorage.getItem("qc_locale") === "ar" ? "ar" : "en";
  const theme = localStorage.getItem("qc_theme") === "dark" ? "dark" : "light";
  return setMemory({ locale, theme });
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export const PREFERENCE_BOOTSTRAP = `(function(){try{var l=localStorage.getItem("qc_locale")||"${defaultLocale}";var t=localStorage.getItem("qc_theme")||"${defaultThemeMode}";var d=document.documentElement;d.lang=l;d.dir=l==="ar"?"rtl":"ltr";d.dataset.theme=t;d.classList.toggle("dark",t==="dark");}catch(e){}})();`;

export function PreferencesProvider({
  children,
  initialLocale = defaultLocale,
  initialTheme = defaultThemeMode,
}: {
  children: React.ReactNode;
  initialLocale?: Locale;
  initialTheme?: ThemeMode;
}) {
  const serverSnapshot = useRef<Snapshot>({ locale: initialLocale, theme: initialTheme });
  const snapshot = useSyncExternalStore(subscribe, read, () => serverSnapshot.current);
  const locale = snapshot.locale;
  const theme = snapshot.theme;

  const value = useMemo<Preferences>(
    () => ({
      locale,
      theme,
      dir: locale === "ar" ? "rtl" : "ltr",
      setLocale: (next) => persist({ locale: next, theme: read().theme }),
      setTheme: (next) => persist({ locale: read().locale, theme: next }),
      t: (key, vars) => translate(locale, key, vars),
    }),
    [locale, theme],
  );

  return <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>;
}

export function usePreferences() {
  const value = useContext(PreferencesContext);
  if (!value) throw new Error("usePreferences must be used within PreferencesProvider");
  return value;
}
