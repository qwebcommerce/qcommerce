"use client";

import { useEffect, useState } from "react";
import BrandLogo from "@/components/BrandLogo";
import { usePreferences } from "@/lib/preferences";
import { loc, theme } from "@/theme.config";

let dismissed = false;

export default function LoadingScreen() {
  const { locale } = usePreferences();
  const [exiting, setExiting] = useState(false);
  const [hidden, setHidden] = useState(dismissed);

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
        backgroundColor: "#0D0D0D",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        transform: exiting ? "translateY(-100%)" : "translateY(0)",
        transition: "transform 0.75s cubic-bezier(0.76, 0, 0.24, 1)",
      }}
    >
      <div style={{ animation: "letterIn 0.7s cubic-bezier(0.34, 1.2, 0.64, 1) both" }}>
        <BrandLogo size="splash" />
      </div>
      <p
        style={{
          color: "rgba(255,255,255,0.45)",
          fontSize: "0.6rem",
          letterSpacing: "0.5em",
          textTransform: "uppercase",
          marginTop: "1.25rem",
          animation: "letterIn 0.6s ease both",
          animationDelay: "0.35s",
        }}
      >
        {loc(theme.brand.tagline, locale)}
      </p>
    </div>
  );
}
