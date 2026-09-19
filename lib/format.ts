import { theme } from "@/theme.config";
import type { StoreSettings } from "@/types";

export const DEFAULT_STORE_SETTINGS: StoreSettings = {
  freeShippingFrom: 500,
  shippingFee: 25,
  returnDays: 14,
  promoCode: "VB20",
  promoPercent: 20,
  dropshipEnabled: false,
  dropshipBuffer: 3,
};

export function formatQar(amount: number): string {
  return `${theme.commerce.currency} ${Math.round(amount).toLocaleString("en-US")}`;
}

export function slugify(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function formatDate(iso: string, locale = "en"): string {
  return new Date(iso).toLocaleDateString(locale === "ar" ? "ar-QA" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function shippingFor(subtotal: number, settings: StoreSettings = DEFAULT_STORE_SETTINGS): number {
  return subtotal >= settings.freeShippingFrom ? 0 : settings.shippingFee;
}

export function normalizePromo(code: string): string {
  return code.trim().toUpperCase();
}

export function promoIsActive(settings: StoreSettings): boolean {
  return Boolean(normalizePromo(settings.promoCode)) && settings.promoPercent > 0;
}

export function promoDiscount(subtotal: number, percent: number): number {
  if (percent <= 0 || subtotal <= 0) return 0;
  return Math.round(subtotal * (percent / 100));
}

export function newId(prefix = "id"): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}
