import { theme } from "@/theme.config";

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

export function shippingFor(subtotal: number): number {
  return subtotal >= theme.commerce.freeShippingFrom ? 0 : theme.commerce.shippingFee;
}

export function newId(prefix = "id"): string {
  return `${prefix}_${crypto.randomUUID().slice(0, 8)}`;
}
