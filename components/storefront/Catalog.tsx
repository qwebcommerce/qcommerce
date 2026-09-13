"use client";

import Link from "next/link";
import ProductCard from "@/components/storefront/ProductCard";
import { categoryLabel } from "@/lib/i18n";
import { usePreferences } from "@/lib/preferences";
import type { Category, Product } from "@/types";

export default function Catalog({
  title,
  products,
  categories,
  activeSlug,
  sort,
}: {
  title: string;
  products: Product[];
  categories: Category[];
  activeSlug?: string;
  sort?: string;
}) {
  const { t, locale } = usePreferences();
  return (
    <section className="page-section" style={{ maxWidth: 1400 }}>
      <span className="section-eyebrow">{t("collections")}</span>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", gap: "1rem", flexWrap: "wrap", marginBottom: "2.5rem" }}>
        <h1 className="section-title">{activeSlug ? categoryLabel(locale, activeSlug, title) : t("allProducts")}</h1>
        <p style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{t("productsCount", { count: products.length })}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "2.5rem" }} className="max-md:grid-cols-1">
        <aside>
          <p className="admin-label">{t("categories")}</p>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.7rem" }}>
            <Link href="/shop" style={{ color: !activeSlug ? "var(--gold)" : "var(--black)", textDecoration: "none", fontSize: "0.9rem" }}>{t("all")}</Link>
            {categories.map((cat) => (
              <Link key={cat.id} href={`/shop/${cat.slug}`} style={{ color: activeSlug === cat.slug ? "var(--gold)" : "var(--black)", textDecoration: "none", fontSize: "0.9rem" }}>
                {categoryLabel(locale, cat.slug, cat.name)}
              </Link>
            ))}
          </div>
        </aside>
        <div>
          <div style={{ marginBottom: "1.5rem", display: "flex", justifyContent: "flex-end", gap: "0.75rem", flexWrap: "wrap" }}>
            {[
              { value: "newest", label: t("newest") },
              { value: "price-asc", label: t("priceLow") },
              { value: "price-desc", label: t("priceHigh") },
              { value: "name", label: t("name") },
            ].map((option) => {
              const href = activeSlug ? `/shop/${activeSlug}?sort=${option.value}` : `/shop?sort=${option.value}`;
              const active = (sort ?? "newest") === option.value;
              return (
                <Link key={option.value} href={href} className={`filter-tab${active ? " active" : ""}`}>
                  {option.label}
                </Link>
              );
            })}
          </div>
          {products.length === 0 ? (
            <p style={{ color: "var(--muted)" }}>{t("noProducts")}</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-5 gap-y-10">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
