"use client";

import { useEffect, useState } from "react";
import { usePreferences } from "@/lib/preferences";
import { loc, theme } from "@/theme.config";

let dismissed = false;

export default function LoadingScreen() {
  const { locale } = usePreferences();
  const [exiting, setExiting] = useState(false);
  const [hidden, setHidden] = useState(dismissed);
  const letters = theme.brand.name.split("");

  useEffect(() => {
    if (dismissed) return;
    const t1 = setTimeout(() => setExiting(true), 2400);
    const t2 = setTimeout(() => {
      dismissed = true;
      setHidden(true);
    }, 3100);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, []);

  if (hidden) return null;

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "var(--warm-white)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transform: exiting ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 0.75s cubic-bezier(0.76, 0, 0.24, 1)",
      }}
    >
      <div style={{ display: "flex", overflow: "visible" }}>
        {letters.map((letter, i) => (
          <div key={`${letter}-${i}`} style={{ overflow: "hidden", lineHeight: 1 }}>
            <span
              style={{
                display: "block",
                color: "var(--black)",
                fontSize: "clamp(2.8rem, 8vw, 5.5rem)",
                fontWeight: 900,
                letterSpacing: "0.08em",
                lineHeight: 1,
                animation: "letterIn 0.65s cubic-bezier(0.34, 1.2, 0.64, 1) both",
                animationDelay: `${0.1 + i * 0.07}s`,
              }}
            >
              {letter}
            </span>
          </div>
        ))}
      </div>
      <p
        style={{
          color: "var(--muted)",
          fontSize: "0.6rem",
          letterSpacing: "0.5em",
          textTransform: "uppercase",
          marginTop: "1rem",
          animation: "letterIn 0.6s ease both",
          animationDelay: "0.85s",
        }}
      >
        {loc(theme.brand.tagline, locale)}
      </p>
    </div>
  );
}
