"use client";

import Link from "next/link";
import { formatQar } from "@/lib/format";
import { categoryLabel } from "@/lib/i18n";
import { usePreferences } from "@/lib/preferences";
import { useCart } from "@/lib/store";
import type { Product } from "@/types";

const BADGE: Record<string, { bg: string; color: string }> = {
  BESTSELLER: { bg: "var(--gold)", color: "var(--accent-ink)" },
  TRENDING: { bg: "var(--gold)", color: "var(--accent-ink)" },
  NEW: { bg: "var(--gold)", color: "var(--accent-ink)" },
  SALE: { bg: "var(--sale)", color: "#fff" },
};

export default function ProductCard({
  product,
  width,
}: {
  product: Product;
  width?: number;
}) {
  const { add } = useCart();
  const { t, locale } = usePreferences();
  const style = BADGE[product.badge ?? ""];

  return (
    <article className="product-card" style={{ width: width ? `${width}px` : undefined, flexShrink: width ? 0 : undefined, scrollSnapAlign: width ? "start" : undefined, position: "relative" }}>
      <div className="prod-img" style={width ? { width: `${width}px` } : undefined}>
        <Link href={`/product/${product.slug}`} style={{ position: "absolute", inset: 0 }}>
          <img src={product.images[0]} alt={product.name} loading="lazy" />
        </Link>
        {style && product.badge && (
          <span
            style={{
              position: "absolute",
              top: "0.75rem",
              left: "0.75rem",
              zIndex: 1,
              backgroundColor: style.bg,
              color: style.color,
              fontSize: "0.52rem",
              fontWeight: 800,
              letterSpacing: "0.15em",
              padding: "0.25rem 0.65rem",
              textTransform: "uppercase",
            }}
          >
            {product.badge}
          </span>
        )}
        <button
          type="button"
          className="add-btn"
          onClick={() => add(product)}
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            zIndex: 2,
            backgroundColor: "var(--gold)",
            color: "var(--accent-ink)",
            textAlign: "center",
            padding: "0.85rem",
            fontSize: "0.62rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            border: "none",
            cursor: "pointer",
            width: "100%",
          }}
        >
          {t("addToBag")}
        </button>
      </div>
      <Link href={`/product/${product.slug}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        <p style={{ fontSize: "0.58rem", color: "var(--muted)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
          {categoryLabel(locale, product.categorySlug, product.category)}
        </p>
        <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--black)", marginBottom: "0.4rem", lineHeight: 1.3 }}>
          {product.name}
        </p>
        <div style={{ display: "flex", gap: "0.55rem", alignItems: "baseline" }}>
          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--black)" }}>{formatQar(product.price)}</span>
          {product.compareAtPrice && (
            <span style={{ fontSize: "0.75rem", color: "var(--muted)", textDecoration: "line-through" }}>{formatQar(product.compareAtPrice)}</span>
          )}
        </div>
      </Link>
    </article>
  );
}
