"use client";

import ProductCard from "@/components/storefront/ProductCard";
import { usePreferences } from "@/lib/preferences";
import type { Product } from "@/types";

export default function SearchResults({ q, products }: { q: string; products: Product[] }) {
  const { t } = usePreferences();
  return (
    <section className="page-section" style={{ maxWidth: 1400 }}>
      <span className="section-eyebrow">{t("search")}</span>
      <h1 className="section-title" style={{ marginBottom: "2rem" }}>
        {q ? t("resultsFor", { q }) : t("searchTitle")}
      </h1>
      {q && products.length === 0 && <p style={{ color: "var(--muted)" }}>{t("noResults", { q })}</p>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} />
        ))}
      </div>
    </section>
  );
}
