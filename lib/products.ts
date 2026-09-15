import type { Product, ProductVariant } from "@/types";
import type { Locale } from "@/theme.config";

export function bilingualCopy(en: string, ar: string | undefined, locale: Locale) {
  const english = en.trim();
  const arabic = (ar ?? "").trim();
  if (locale === "ar") {
    const primary = arabic || english;
    return {
      primary,
      secondary: primary && english && english !== primary ? english : "",
      primaryDir: (arabic ? "rtl" : "ltr") as "rtl" | "ltr",
      secondaryDir: "ltr" as const,
    };
  }
  return {
    primary: english,
    secondary: arabic && arabic !== english ? arabic : "",
    primaryDir: "ltr" as const,
    secondaryDir: "rtl" as const,
  };
}

export function localizedProductName(product: Pick<Product, "name" | "nameAr">, locale: Locale) {
  return bilingualCopy(product.name, product.nameAr, locale).primary;
}

export function localizedProductDescription(
  product: Pick<Product, "description" | "descriptionAr">,
  locale: Locale,
) {
  return bilingualCopy(product.description, product.descriptionAr, locale).primary;
}

export function matchesProductSearch(product: Product, query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [
    product.name,
    product.nameAr,
    product.description,
    product.descriptionAr,
    product.sku,
    product.slug,
    product.category,
  ]
    .join(" ")
    .toLowerCase()
    .includes(needle);
}

export function csvList(value: string) {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

export function variantKey(size: string, color: string) {
  return `${size}||${color}`;
}

export function findVariant(product: Product, size?: string, color?: string) {
  if (!product.hasVariants || product.variants.length === 0) return null;
  const sizeValue = size ?? "";
  const colorValue = color ?? "";
  return (
    product.variants.find((variant) => variant.size === sizeValue && variant.color === colorValue) ??
    product.variants.find((variant) => (sizeValue ? variant.size === sizeValue : true) && (colorValue ? variant.color === colorValue : true)) ??
    null
  );
}

export function firstAvailableVariant(product: Product) {
  if (!product.hasVariants) return null;
  return product.variants.find((variant) => variant.stock > 0) ?? product.variants[0] ?? null;
}

export function productStock(product: Pick<Product, "stock" | "hasVariants" | "variants">) {
  if (product.hasVariants && product.variants.length) {
    return product.variants.reduce((sum, variant) => sum + variant.stock, 0);
  }
  return product.stock;
}

export function productIsLowStock(product: Pick<Product, "stock" | "hasVariants" | "variants">) {
  if (product.hasVariants && product.variants.length) {
    return product.variants.some((variant) => variant.stock <= 10);
  }
  return product.stock <= 10;
}

export function productPriceRange(product: Pick<Product, "price" | "hasVariants" | "variants">) {
  if (!product.hasVariants || product.variants.length === 0) {
    return { min: product.price, max: product.price };
  }
  const prices = product.variants.map((variant) => variant.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}

export function variantImage(product: Product, variant?: ProductVariant | null) {
  return variant?.image || product.images[0] || "";
}

export function syncProductVariants(
  existing: ProductVariant[],
  sizes: string[],
  colors: string[],
  defaults: { price: number; stock: number; sku: string; compareAtPrice: number | null },
): ProductVariant[] {
  const sizeList = sizes.length ? sizes : [""];
  const colorList = colors.length ? colors : [""];
  const byKey = new Map(existing.map((variant) => [variantKey(variant.size, variant.color), variant]));
  const next: ProductVariant[] = [];
  for (const size of sizeList) {
    for (const color of colorList) {
      const previous = byKey.get(variantKey(size, color));
      if (previous) {
        next.push({ ...previous, size, color });
        continue;
      }
      const skuParts = [defaults.sku, size, color].filter(Boolean);
      next.push({
        id: crypto.randomUUID(),
        size,
        color,
        sku: skuParts.join("-").toUpperCase(),
        price: defaults.price,
        compareAtPrice: defaults.compareAtPrice,
        stock: defaults.stock,
        image: "",
      });
    }
  }
  return next;
}
