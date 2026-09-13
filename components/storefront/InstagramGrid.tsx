"use client";

import { usePreferences } from "@/lib/preferences";
import { theme } from "@/theme.config";

export default function InstagramGrid() {
  const { t } = usePreferences();
  return (
    <section style={{ backgroundColor: "var(--warm-white)", padding: "6rem 1.5rem" }}>
      <div style={{ maxWidth: "1400px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "3rem" }}>
          <span className="section-eyebrow" style={{ display: "block", textAlign: "center" }}>{t("community")}</span>
          <h2 className="section-title" style={{ color: "var(--black)" }}>{t("styleInspiration")}</h2>
          <p style={{ color: "var(--muted)", fontSize: "0.88rem", marginTop: "1rem" }}>
            {t("tagToFeature", { handle: theme.brand.instagram })}
          </p>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {theme.instagram.map((post) => (
            <div key={post.handle} className="insta-item img-zoom" style={{ position: "relative", aspectRatio: "1/1", overflow: "hidden", backgroundColor: "var(--sand)" }}>
              <img src={post.img} alt={post.handle} />
              <div className="insta-overlay" style={{ position: "absolute", inset: 0, background: "rgba(13,13,13,0.62)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <span style={{ color: "#fff", fontSize: "0.7rem", fontWeight: 600 }}>{post.handle}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
