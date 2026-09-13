"use client";

import Link from "next/link";
import ProductCard from "@/components/storefront/ProductCard";
import { usePreferences } from "@/lib/preferences";
import type { Product } from "@/types";

export default function NewArrivals({ products }: { products: Product[] }) {
  const { t } = usePreferences();
  return (
    <section style={{ backgroundColor: "var(--warm-white)", padding: "5.5rem 0" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", padding: "0 2rem", marginBottom: "2.5rem", flexWrap: "wrap", gap: "1rem" }}>
          <div>
            <span className="section-eyebrow">{t("justDropped")}</span>
            <h2 className="section-title" style={{ color: "var(--black)" }}>{t("newInThisWeek")}</h2>
          </div>
          <Link href="/shop/new-arrivals" style={{ color: "var(--gold)", fontSize: "0.7rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", textDecoration: "none", borderBottom: "1px solid rgba(201,169,110,0.4)", paddingBottom: "2px" }}>
            {t("viewAllNewIn")}
          </Link>
        </div>
        <div style={{ display: "flex", gap: "1.25rem", overflowX: "auto", padding: "0 2rem 1.5rem", scrollSnapType: "x mandatory", scrollbarWidth: "none" }}>
          {products.map((product) => (
            <ProductCard key={product.id} product={product} width={240} />
          ))}
        </div>
      </div>
    </section>
  );
}
