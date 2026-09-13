"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import ProductCard from "@/components/storefront/ProductCard";
import { categoryLabel } from "@/lib/i18n";
import { usePreferences } from "@/lib/preferences";
import type { Product } from "@/types";

export default function FeaturedProducts({ products }: { products: Product[] }) {
  const { t, locale } = usePreferences();
  const groups = useMemo(() => {
    const unique = Array.from(new Map(products.map((p) => [p.categorySlug, p.category])).entries());
    return unique;
  }, [products]);
  const [active, setActive] = useState("all");
  const visible = active === "all" ? products : products.filter((p) => p.categorySlug === active);

  return (
    <section style={{ backgroundColor: "var(--warm-white)", padding: "6rem 1.5rem" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ marginBottom: "3rem" }}>
          <span className="section-eyebrow">{t("topPicks")}</span>
          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "1.5rem" }}>
            <h2 className="section-title" style={{ color: "var(--black)" }}>{t("bestSellers")}</h2>
            <p style={{ color: "var(--muted)", fontSize: "0.82rem" }}>
              {visible.length} {visible.length === 1 ? t("item") : t("items")}
            </p>
          </div>
        </div>
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap", marginBottom: "2.5rem", borderBottom: "1px solid var(--sand)", paddingBottom: "2rem" }}>
          <button onClick={() => setActive("all")} className={`filter-tab${active === "all" ? " active" : ""}`}>{t("all")}</button>
          {groups.map(([slug, name]) => (
            <button key={slug} onClick={() => setActive(slug)} className={`filter-tab${active === slug ? " active" : ""}`}>
              {categoryLabel(locale, slug, name)}
            </button>
          ))}
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
          {visible.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        <div style={{ textAlign: "center", marginTop: "4rem" }}>
          <Link href={active === "all" ? "/shop" : `/shop/${visible[0]?.categorySlug ?? "all"}`} className="btn-outline-black">
            {active === "all" ? t("viewAllProducts") : `${t("viewAll")} ${categoryLabel(locale, active, visible[0]?.category ?? "")}`}
          </Link>
        </div>
      </div>
    </section>
  );
}
