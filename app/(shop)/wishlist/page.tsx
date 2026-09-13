"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "@/components/storefront/ProductCard";
import { usePreferences } from "@/lib/preferences";
import { useWishlist } from "@/lib/store";
import type { Product } from "@/types";

export default function WishlistPage() {
  const { ids } = useWishlist();
  const { t } = usePreferences();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    fetch("/api/products")
      .then((res) => res.json())
      .then((all: Product[]) => setProducts(all.filter((p) => ids.includes(p.id))))
      .catch(() => setProducts([]));
  }, [ids]);

  return (
    <section className="page-section" style={{ maxWidth: 1400 }}>
      <span className="section-eyebrow">{t("savedItems")}</span>
      <h1 className="section-title" style={{ marginBottom: "2rem" }}>{t("yourWishlist")}</h1>
      {ids.length === 0 ? (
        <>
          <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>{t("wishlistEmpty")}</p>
          <Link href="/shop" className="btn-gold">{t("continueShopping")}</Link>
        </>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
