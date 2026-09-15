"use client";

import Link from "next/link";
import ProductCard from "@/components/storefront/ProductCard";
import { nestCategories, localizedCategoryName } from "@/lib/categories";
import { usePreferences } from "@/lib/preferences";
import type { Category, Product } from "@/types";

export default function Catalog({
  title: _title,
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
  const tree = nestCategories(categories);
  const active = categories.find((category) => category.slug === activeSlug);
  return (
    <section className="page-section catalog">
      <span className="section-eyebrow">{t("collections")}</span>
      <div className="catalog__head">
        <h1 className="section-title">{active ? localizedCategoryName(active, locale) : t("allProducts")}</h1>
        <p className="catalog__count">{t("productsCount", { count: products.length })}</p>
      </div>
      <div className="catalog__body">
        <aside className="catalog__nav">
          <p className="admin-label">{t("categories")}</p>
          <div className="catalog__cats">
            <Link href="/shop" className={`catalog__cat${!activeSlug ? " is-active" : ""}`}>
              {t("all")}
            </Link>
            {tree.map((cat) => (
              <div key={cat.id} className="catalog__group">
                <Link href={`/shop/${cat.slug}`} className={`catalog__cat${activeSlug === cat.slug ? " is-active" : ""}`}>
                  {localizedCategoryName(cat, locale)}
                </Link>
                {cat.children.map((child) => (
                  <Link
                    key={child.id}
                    href={`/shop/${child.slug}`}
                    className={`catalog__cat catalog__cat--child${activeSlug === child.slug ? " is-active" : ""}`}
                  >
                    {localizedCategoryName(child, locale)}
                  </Link>
                ))}
              </div>
            ))}
          </div>
        </aside>
        <div className="catalog__main">
          <div className="catalog__sort">
            {[
              { value: "newest", label: t("newest") },
              { value: "price-asc", label: t("priceLow") },
              { value: "price-desc", label: t("priceHigh") },
              { value: "name", label: t("name") },
            ].map((option) => {
              const href = activeSlug ? `/shop/${activeSlug}?sort=${option.value}` : `/shop?sort=${option.value}`;
              const isActive = (sort ?? "newest") === option.value;
              return (
                <Link key={option.value} href={href} className={`filter-tab${isActive ? " active" : ""}`}>
                  {option.label}
                </Link>
              );
            })}
          </div>
          {products.length === 0 ? (
            <p className="catalog__empty">{t("noProducts")}</p>
          ) : (
            <div className="catalog__grid">
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
