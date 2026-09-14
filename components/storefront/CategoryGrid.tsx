"use client";

import Link from "next/link";
import { localizedCategoryName, localizedCategorySubtitle } from "@/lib/categories";
import { usePreferences } from "@/lib/preferences";
import type { Category } from "@/types";

export default function CategoryGrid({ categories }: { categories: Category[] }) {
  const { t, locale } = usePreferences();
  return (
    <section style={{ backgroundColor: "var(--warm-white)", padding: "6rem 1.5rem" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3.5rem" }}>
          <span className="section-eyebrow" style={{ display: "block", textAlign: "center" }}>{t("explore")}</span>
          <h2 className="section-title" style={{ color: "var(--black)" }}>{t("shopByCategory")}</h2>
          <div style={{ width: "40px", height: "1px", backgroundColor: "var(--gold)", margin: "1.5rem auto 0" }} />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categories.filter((cat) => !cat.parentId).map((cat) => (
            <Link key={cat.id} href={`/shop/${cat.slug}`} className="cat-card" style={{ display: "block", textDecoration: "none", position: "relative" }}>
              <div style={{ position: "relative", width: "100%", paddingTop: "125%", overflow: "hidden", backgroundColor: "var(--sand)" }}>
                <img src={cat.image} alt={localizedCategoryName(cat, locale)} loading="lazy" style={{ position: "absolute", inset: 0, width: "100%", height: "100%", objectFit: "cover", objectPosition: "center top" }} />
                <div className="cat-overlay" style={{ position: "absolute", inset: 0 }} />
                <div style={{ position: "absolute", bottom: 0, left: 0, right: 0, padding: "2.5rem 1.25rem 1.25rem", background: "linear-gradient(to top, rgba(13,13,13,0.88) 0%, transparent 100%)" }}>
                  <p style={{ color: "rgba(255,255,255,0.52)", fontSize: "0.56rem", letterSpacing: "0.28em", textTransform: "uppercase", marginBottom: "0.3rem" }}>{localizedCategorySubtitle(cat, locale)}</p>
                  <p className="cat-label" style={{ color: "#fff", fontSize: "1rem", fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase" }}>
                    {localizedCategoryName(cat, locale)}
                  </p>
                  <div className="cat-gold-line" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
