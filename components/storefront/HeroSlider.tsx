"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePreferences } from "@/lib/preferences";
import { loc, theme } from "@/theme.config";
import type { MessageKey } from "@/lib/i18n";

export default function HeroSlider() {
  const { locale, dir, t } = usePreferences();
  const [current, setCurrent] = useState(0);
  const slides = theme.hero;

  useEffect(() => {
    const timer = setInterval(() => setCurrent((c) => (c + 1) % slides.length), 5500);
    return () => clearInterval(timer);
  }, [slides.length]);

  const slide = slides[current];
  const isStart = slide.align === "left";
  const startSide = dir === "rtl" ? "flex-end" : "flex-start";

  return (
    <section style={{ position: "relative", width: "100%", height: "100vh", minHeight: "640px", overflow: "hidden", backgroundColor: "var(--sand)" }}>
      {slides.map((s, i) => (
        <div
          key={loc(s.headline, "en")}
          style={{
            position: "absolute",
            inset: 0,
            opacity: i === current ? 1 : 0,
            transition: "opacity 1.1s ease",
            zIndex: i === current ? 1 : 0,
          }}
        >
          <img src={s.img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover", objectPosition: "center 25%" }} />
          <div style={{ position: "absolute", inset: 0, background: "linear-gradient(180deg, rgba(0,0,0,0.1) 0%, rgba(0,0,0,0.35) 50%, rgba(0,0,0,0.72) 100%)" }} />
        </div>
      ))}

      <div
        key={`${current}-${locale}`}
        style={{
          position: "absolute",
          inset: 0,
          zIndex: 2,
          display: "flex",
          alignItems: "center",
          justifyContent: isStart ? startSide : "center",
          padding: isStart ? "0 6rem" : "0 2rem",
          paddingTop: "120px",
        }}
      >
        <div style={{ textAlign: isStart ? (dir === "rtl" ? "right" : "left") : "center", maxWidth: "680px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "1rem", justifyContent: isStart ? startSide : "center", marginBottom: "1.5rem", animation: "fadeUp 0.7s ease both" }}>
            <div style={{ width: "32px", height: "1px", backgroundColor: "var(--gold)", opacity: 0.7 }} />
            <span style={{ color: "var(--gold)", fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.4em", textTransform: "uppercase" }}>{loc(slide.eyebrow, locale)}</span>
            <div style={{ width: "32px", height: "1px", backgroundColor: "var(--gold)", opacity: 0.7 }} />
          </div>
          <h1 style={{ color: "#fff", fontWeight: 800, lineHeight: 1.08, fontSize: "clamp(2.8rem, 6vw, 5.8rem)", letterSpacing: "-0.02em", textTransform: "uppercase", marginBottom: "1.5rem", animation: "fadeUp 0.7s ease both", animationDelay: "0.15s" }}>
            {loc(slide.headline, locale)}
          </h1>
          <p style={{ color: "rgba(255,255,255,0.62)", fontSize: "0.95rem", lineHeight: 1.75, maxWidth: "380px", margin: isStart ? "0 0 2.5rem" : "0 auto 2.5rem", animation: "fadeUp 0.7s ease both", animationDelay: "0.28s" }}>
            {loc(slide.sub, locale)}
          </p>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", justifyContent: isStart ? startSide : "center", animation: "fadeUp 0.7s ease both", animationDelay: "0.4s" }}>
            <Link href={slide.cta1.href} className="btn-gold">{t(slide.cta1.key as MessageKey)}</Link>
            <Link href={slide.cta2.href} className="btn-outline-white">{t(slide.cta2.key as MessageKey)}</Link>
          </div>
        </div>
      </div>
    </section>
  );
}
