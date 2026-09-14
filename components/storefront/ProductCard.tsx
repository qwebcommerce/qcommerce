"use client";

import Link from "next/link";
import { formatQar } from "@/lib/format";
import { categoryLabel } from "@/lib/i18n";
import { firstAvailableVariant, localizedProductName, productPriceRange, productStock, variantImage } from "@/lib/products";
import { usePreferences } from "@/lib/preferences";
import { useCart, useWishlist } from "@/lib/store";
import { useToast } from "@/lib/toast";
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
  showRemove,
}: {
  product: Product;
  width?: number;
  showRemove?: boolean;
}) {
  const { add } = useCart();
  const { toggle, remove, has } = useWishlist();
  const toast = useToast();
  const { t, locale } = usePreferences();
  const style = BADGE[product.badge ?? ""];
  const name = localizedProductName(product, locale);
  const range = productPriceRange(product);
  const stock = productStock(product);
  const variant = firstAvailableVariant(product);
  const cover = variantImage(product, variant);
  const saved = has(product.id);
  const simple = !product.hasVariants;

  function addToBag() {
    if (!simple || stock <= 0) return;
    add(product);
    toast.success(t("toastAddedToBag"), name);
  }

  return (
    <article className="product-card" style={{ width: width ? `${width}px` : undefined, flexShrink: width ? 0 : undefined, scrollSnapAlign: width ? "start" : undefined, position: "relative" }}>
      <div className="prod-img" style={width ? { width: `${width}px` } : undefined}>
        <Link href={`/product/${product.slug}`} style={{ position: "absolute", inset: 0 }}>
          <img src={cover} alt={name} loading="lazy" />
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
          className={`fav-btn${saved ? " is-on" : ""}`}
          aria-pressed={saved}
          aria-label={saved ? t("savedToWishlist") : t("addToWishlist")}
          title={saved ? t("savedToWishlist") : t("addToWishlist")}
          onClick={() => toggle(product.id)}
        >
          <HeartIcon filled={saved} />
        </button>
        {simple ? (
          <button
            type="button"
            className="add-btn"
            onClick={addToBag}
            disabled={stock <= 0}
          >
            {stock <= 0 ? t("outOfStock") : t("addToBag")}
          </button>
        ) : null}
      </div>
      <Link href={`/product/${product.slug}`} style={{ textDecoration: "none", color: "inherit", display: "block" }}>
        <p style={{ fontSize: "0.58rem", color: "var(--muted)", letterSpacing: "0.18em", textTransform: "uppercase", marginBottom: "0.35rem" }}>
          {categoryLabel(locale, product.categorySlug, product.category)}
        </p>
        <p style={{ fontSize: "0.9rem", fontWeight: 600, color: "var(--black)", marginBottom: "0.4rem", lineHeight: 1.3 }}>
          {name}
        </p>
        <div style={{ display: "flex", gap: "0.55rem", alignItems: "baseline" }}>
          <span style={{ fontSize: "0.88rem", fontWeight: 700, color: "var(--black)" }}>
            {range.min !== range.max ? t("fromPrice", { price: formatQar(range.min) }) : formatQar(range.min)}
          </span>
          {product.compareAtPrice && (
            <span style={{ fontSize: "0.75rem", color: "var(--muted)", textDecoration: "line-through" }}>{formatQar(product.compareAtPrice)}</span>
          )}
        </div>
      </Link>
      {showRemove ? (
        <button type="button" className="wishlist-remove" onClick={() => remove(product.id)}>
          {t("removeFavorite")}
        </button>
      ) : null}
    </article>
  );
}

function HeartIcon({ filled }: { filled: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M12 20.4s-7.2-4.35-9.3-8.55C1.2 9.15 2.4 5.7 5.7 4.95c1.8-.4 3.45.3 4.5 1.65C11.25 5.25 12.9 4.55 14.7 4.95c3.3.75 4.5 4.2 3 6.9C19.2 16.05 12 20.4 12 20.4Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
    </svg>
  );
}
