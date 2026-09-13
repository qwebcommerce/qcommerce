"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { usePreferences } from "@/lib/preferences";
import { useUi } from "@/lib/store";

export default function SearchModal() {
  const { searchOpen, setSearchOpen } = useUi();
  const { t } = usePreferences();
  const [q, setQ] = useState("");
  const router = useRouter();

  if (!searchOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100, background: "color-mix(in srgb, var(--warm-white) 97%, transparent)", color: "var(--black)", display: "flex", alignItems: "flex-start", justifyContent: "center", padding: "8rem 1.5rem" }}>
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (!q.trim()) return;
          setSearchOpen(false);
          router.push(`/search?q=${encodeURIComponent(q.trim())}`);
        }}
        style={{ width: "min(720px, 100%)" }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
          <span className="section-eyebrow">{t("search")}</span>
          <button type="button" onClick={() => setSearchOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem" }}>×</button>
        </div>
        <input
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder={t("searchPlaceholder")}
          className="nl-input"
          style={{ fontSize: "1.4rem" }}
        />
      </form>
    </div>
  );
}
