"use client";

import { usePreferences } from "@/lib/preferences";
import { theme } from "@/theme.config";

export default function PressSection() {
  const { t } = usePreferences();
  return (
    <section style={{ backgroundColor: "var(--warm-white)", borderTop: "1px solid var(--sand)", borderBottom: "1px solid var(--sand)", padding: "4rem 1.5rem" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <p style={{ textAlign: "center", fontSize: "0.6rem", letterSpacing: "0.4em", textTransform: "uppercase", color: "var(--muted)", marginBottom: "2.5rem", fontWeight: 600 }}>
          {t("asSeenIn")}
        </p>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", flexWrap: "wrap" }}>
          {theme.press.map((p, i) => (
            <div key={p.name} style={{ flex: "1 1 160px", display: "flex", flexDirection: "column", alignItems: "center", padding: "1.5rem 2rem", borderInlineEnd: i < theme.press.length - 1 ? "1px solid var(--sand)" : "none", opacity: 0.45 }}>
              <p style={{ fontSize: "1.3rem", fontWeight: 900, letterSpacing: "0.1em", color: "var(--black)" }}>{p.name}</p>
              {p.sub && <p style={{ fontSize: "0.55rem", letterSpacing: "0.25em", color: "var(--muted)", textTransform: "uppercase", marginTop: "0.3rem" }}>{p.sub}</p>}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
