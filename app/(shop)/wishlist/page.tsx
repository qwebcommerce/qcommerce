"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import ProductCard from "@/components/storefront/ProductCard";
import { usePreferences } from "@/lib/preferences";
import { useWishlist } from "@/lib/store";
import { useToast } from "@/lib/toast";
import type { Product } from "@/types";

export default function WishlistPage() {
  const { ids, clear } = useWishlist();
  const { t } = usePreferences();
  const toast = useToast();
  const [catalog, setCatalog] = useState<Product[]>([]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/products")
      .then((res) => res.json())
      .then((all: Product[]) => {
        if (!cancelled) setCatalog(all);
      })
      .catch(() => {
        if (!cancelled) setCatalog([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const [confirmingClear, setConfirmingClear] = useState(false);

  const products = catalog.filter((product) => ids.includes(product.id));

  function clearAll() {
    if (!ids.length) return;
    if (!confirmingClear) {
      setConfirmingClear(true);
      return;
    }
    clear();
    setConfirmingClear(false);
    toast.success(t("wishlistCleared"));
  }

  return (
    <section className="page-section" style={{ maxWidth: 1400 }}>
      <div className="wishlist-head">
        <div>
          <span className="section-eyebrow">{t("savedItems")}</span>
          <h1 className="section-title">{t("yourWishlist")}</h1>
        </div>
        {ids.length > 0 ? (
          <button type="button" className="btn-outline-black" onClick={clearAll}>
            {confirmingClear ? t("confirmClearWishlist") : t("clearAllFavorites")}
          </button>
        ) : null}
      </div>
      {ids.length === 0 ? (
        <>
          <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>{t("wishlistEmpty")}</p>
          <Link href="/shop" className="btn-gold">{t("continueShopping")}</Link>
        </>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-x-5 gap-y-10">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} showRemove />
          ))}
        </div>
      )}
    </section>
  );
}
