"use client";

import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/storefront/ProductCard";
import { categoryLabel } from "@/lib/i18n";
import { formatQar } from "@/lib/format";
import { bilingualCopy, findVariant } from "@/lib/products";
import { usePreferences } from "@/lib/preferences";
import { useCart, useWishlist } from "@/lib/store";
import { useToast } from "@/lib/toast";
import type { Product } from "@/types";

export default function ProductDetail({ product, related }: { product: Product; related: Product[] }) {
  const { add } = useCart();
  const toast = useToast();
  const { toggle, has } = useWishlist();
  const { t, locale } = usePreferences();
  const title = bilingualCopy(product.name, product.nameAr, locale);
  const category = bilingualCopy(
    categoryLabel("en", product.categorySlug, product.category),
    categoryLabel("ar", product.categorySlug, product.category),
    locale,
  );
  const name = title.primary;
  const [size, setSize] = useState(product.sizes[0] ?? "");
  const [color, setColor] = useState(product.colors[0] ?? "");
  const [qty, setQty] = useState(1);
  const [image, setImage] = useState(product.images[0] ?? "");
  const saved = has(product.id);
  const variant = findVariant(product, size, color);
  const price = variant?.price ?? product.price;
  const compareAt = variant?.compareAtPrice ?? product.compareAtPrice;
  const stock = variant?.stock ?? product.stock;
  const sku = variant?.sku || product.sku;
  const gallery = useMemo(() => {
    const extras = product.variants.map((item) => item.image).filter(Boolean);
    return Array.from(new Set([...(product.images ?? []), ...extras]));
  }, [product]);

  useEffect(() => {
    if (variant?.image) setImage(variant.image);
  }, [variant?.id, variant?.image]);

  function addToBag() {
    if (stock <= 0) return;
    add(product, { size, color, quantity: qty, variantId: variant?.id });
    toast.success(t("toastAddedToBag"), name);
  }

  return (
    <section className="page-section product-page">
      <div className="product-detail">
        <div>
          <div className="img-zoom" style={{ background: "var(--sand)", aspectRatio: "3/4" }}>
            <img src={image} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
          </div>
          {gallery.length > 1 && (
            <div style={{ display: "flex", gap: "0.6rem", marginTop: "0.75rem" }}>
              {gallery.map((src) => (
                <button key={src} onClick={() => setImage(src)} style={{ width: 72, height: 96, padding: 0, border: src === image ? "1px solid var(--gold)" : "1px solid var(--sand)", background: "none" }}>
                  <img src={src} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                </button>
              ))}
            </div>
          )}
        </div>
        <div>
          <p className="product-detail__kicker">
            <span dir={category.primaryDir}>{category.primary}</span>
            {category.secondary ? (
              <span dir={category.secondaryDir} lang={category.secondaryDir === "rtl" ? "ar" : undefined}>
                {category.secondary}
              </span>
            ) : null}
          </p>
          <h1 className="product-detail__title" dir={title.primaryDir} lang={title.primaryDir === "rtl" ? "ar" : undefined}>
            {title.primary}
          </h1>
          {title.secondary ? (
            <p className="product-title-ar" dir={title.secondaryDir} lang={title.secondaryDir === "rtl" ? "ar" : undefined}>
              {title.secondary}
            </p>
          ) : null}
          <div style={{ display: "flex", gap: "0.75rem", alignItems: "baseline", marginBottom: "1.5rem" }}>
            <span style={{ fontSize: "1.25rem", fontWeight: 700 }}>{formatQar(price)}</span>
            {compareAt ? <span style={{ color: "var(--muted)", textDecoration: "line-through" }}>{formatQar(compareAt)}</span> : null}
          </div>
          <p style={{ fontSize: "0.75rem", letterSpacing: "0.1em", marginBottom: "1.5rem", color: stock > 0 ? "var(--black)" : "var(--sale)" }}>
            {stock > 0 ? t("inStock") : t("outOfStock")} · {t("sku")} {sku}
            {stock > 0 ? ` · ${t("leftInStock", { count: stock })}` : ""}
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
            <button type="button" onClick={() => setQty((q) => Math.min(stock || 1, q + 1))} className="filter-tab">+</button>
          </div>
          <button
            type="button"
            className="btn-gold"
            disabled={stock <= 0}
            style={{ width: "100%", marginBottom: "0.75rem" }}
            onClick={addToBag}
          >
            {stock <= 0 ? t("outOfStock") : t("addToBag")}
          </button>
          <button type="button" className="btn-outline-black" style={{ width: "100%" }} onClick={() => toggle(product.id)}>
            {saved ? t("savedToWishlist") : t("addToWishlist")}
          </button>
          <div style={{ marginTop: "2rem", borderTop: "1px solid var(--sand)", paddingTop: "2rem", color: "var(--muted)", lineHeight: 1.85 }}>
            <h3 style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--black)", marginBottom: "1rem" }}>{t("description")}</h3>
            <div className="product-desc-bilingual">
              {product.description.trim() ? (
                <p dir="ltr" lang="en">
                  {product.description}
                </p>
              ) : null}
              {(product.descriptionAr ?? "").trim() ? (
                <p dir="rtl" lang="ar">
                  {product.descriptionAr}
                </p>
              ) : null}
            </div>
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
