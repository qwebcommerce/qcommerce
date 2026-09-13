"use client";

import { usePreferences } from "@/lib/preferences";
import { theme } from "@/theme.config";

export default function MarqueeTicker({ variant = "dark" }: { variant?: "dark" | "light" }) {
  const { locale } = usePreferences();
  const items = variant === "dark" ? theme.marquee.accent[locale] : theme.marquee.muted[locale];
  const text = `${items.join("  ✦  ")}  ✦  `;
  const isAccent = variant === "dark";

  return (
    <div
      style={{
        backgroundColor: isAccent ? "var(--gold)" : "var(--warm-white)",
        borderTop: "1px solid rgba(201,169,110,0.3)",
        borderBottom: "1px solid rgba(201,169,110,0.3)",
        padding: "0.9rem 0",
        overflow: "hidden",
      }}
    >
      <div className="marquee-track" style={{ userSelect: "none" }}>
        {[0, 1].map((n) => (
          <span
            key={n}
            style={{
              color: isAccent ? "#0D0D0D" : "var(--muted)",
              fontSize: "0.65rem",
              fontWeight: 600,
              letterSpacing: "0.22em",
              textTransform: "uppercase",
              whiteSpace: "nowrap",
              paddingInlineEnd: "5rem",
            }}
          >
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
