import { ar } from "@/lib/i18n/ar";
import { en } from "@/lib/i18n/en";
import { loc, themeCategoryName, type Locale } from "@/theme.config";

export type MessageKey = keyof typeof en;

const dictionaries = { en, ar };

export function dictionary(locale: Locale) {
  return dictionaries[locale];
}

export function translate(locale: Locale, key: MessageKey, vars?: Record<string, string | number>) {
  let value = dictionaries[locale][key] || dictionaries.en[key];
  if (vars) {
    for (const [name, replacement] of Object.entries(vars)) {
      value = value.replaceAll(`{${name}}`, String(replacement));
    }
  }
  return value;
}

export function categoryLabel(locale: Locale, slug: string, fallback: string) {
  const named = themeCategoryName(slug);
  return named ? loc(named, locale) : fallback;
}
