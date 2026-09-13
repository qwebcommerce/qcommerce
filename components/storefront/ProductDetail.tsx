"use client";

import { useState } from "react";
import ProductCard from "@/components/storefront/ProductCard";
import { categoryLabel } from "@/lib/i18n";
import { formatQar } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { useCart, useWishlist } from "@/lib/store";
import type { Product } from "@/types";

export default function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const { add } = useCart();
  const { toggle, has } = useWishlist();
  const { t, locale } = usePreferences();
  const [size, setSize] = useState(product.sizes[0]);
  const [color, setColor] = useState(product.colors[0]);
  const [qty, setQty] = useState(1);
  const [image, setImage] = useState(product.images[0]);
  const saved = has(product.id);

  return (
    <section className="page-section" style={{ maxWidth: 1400 }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem" }} className="max-md:grid-cols-1">
        <div>
          <div className="img-zoom" style={{ background: "var(--sand)", aspectRatio: "3/4" }}>
            <img src={image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          {product.images.length > 1 && (
            <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.75rem" }}>
              {product.images.map((src) => (
                <button key={src} onClick={() => setImage(src)} style={{ width: 72, height: 96, padding: 0, border: src === image ? "1px solid var(--gold)" : "1px solid var(--sand)", background: "none" }}>
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p style={{ fontSize: "0.62rem", color: "var(--gold)", letterSpacing: "0.35em", textTransform: "uppercase", marginBottom: "0.75rem" }}>
            {categoryLabel(locale, product.categorySlug, product.category)}
          </p>
          <h1 style={{ fontSize: "clamp(1.8rem,4vw,2.8rem)", fontWeight: 900, textTransform: "uppercase", letterSpacing: "-0.02em", marginBottom: "1rem" }}>{product.name}</h1>
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 700 }}>{formatQar(product.price)}</span>
            {product.compareAtPrice && <span style={{ color: "var(--muted)", textDecoration: "line-through" }}>{formatQar(product.compareAtPrice)}</span>}
          </div>
          <p style={{ fontSize: "0.75rem", letterSpacing: "0.1em", marginBottom: "1.5rem", color: product.stock > 0 ? "var(--black)" : "var(--sale)" }}>
            {product.stock > 0 ? t("inStock") : t("outOfStock")} · {t("sku")} {product.sku}
          </p>
          {product.sizes.length > 0 && (
            <div style={{ marginBottom: "1.25rem" }}>
              <p className="admin-label">{t("size")}</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {product.sizes.map((value) => (
                  <button key={value} type="button" onClick={() => setSize(value)} className={`filter-tab${size === value ? " active" : ""}`}>{value}</button>
                ))}
              </div>
            </div>
          )}
          {product.colors.length > 0 && (
            <div style={{ marginBottom: "1.25rem" }}>
              <p className="admin-label">{t("color")}</p>
              <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
                {product.colors.map((value) => (
                  <button key={value} type="button" onClick={() => setColor(value)} className={`filter-tab${color === value ? " active" : ""}`}>{value}</button>
                ))}
              </div>
            </div>
          )}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "center", marginBottom: "1.5rem" }}>
            <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} className="filter-tab">−</button>
            <span>{qty}</span>
            <button type="button" onClick={() => setQty((q) => q + 1)} className="filter-tab">+</button>
          </div>
          <button
            type="button"
            className="btn-gold"
            disabled={product.stock <= 0}
            style={{ width: "100%", marginBottom: "0.75rem" }}
            onClick={() => add(product, { size, color, quantity: qty })}
          >
            {t("addToBag")}
          </button>
          <button type="button" className="btn-outline-black" style={{ width: "100%" }} onClick={() => toggle(product.id)}>
            {saved ? t("savedToWishlist") : t("addToWishlist")}
          </button>
          <div style={{ marginTop: "2rem", borderTop: "1px solid var(--sand)", paddingTop: "2rem", color: "var(--muted)", lineHeight: 1.85 }}>
            <h3 style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--black)", marginBottom: "1rem" }}>{t("description")}</h3>
            <p>{product.description}</p>
          </div>
        </div>
      </div>
      {related.length > 0 && (
        <div style={{ marginTop: "5rem", borderTop: "1px solid var(--sand)", paddingTop: "4rem" }}>
          <span className="section-eyebrow">{t("youMayAlsoLike")}</span>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-5" style={{ marginTop: "2rem" }}>
            {related.map((item) => (
              <ProductCard key={item.id} product={item} />
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
