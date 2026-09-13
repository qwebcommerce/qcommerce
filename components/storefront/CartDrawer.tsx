"use client";

import Link from "next/link";
import { formatQar, shippingFor } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { useCart, useUi } from "@/lib/store";

export default function CartDrawer() {
  const { cartOpen, setCartOpen } = useUi();
  const { items, subtotal, update, remove } = useCart();
  const { t, dir } = usePreferences();
  const shipping = shippingFor(subtotal);

  if (!cartOpen) return null;

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 1100 }}>
      <button aria-label={t("close")} onClick={() => setCartOpen(false)} style={{ position: "absolute", inset: 0, background: "rgba(13,13,13,0.45)", border: "none" }} />
      <aside style={{ position: "absolute", top: 0, insetInlineEnd: 0, bottom: 0, width: "min(420px, 100%)", background: "var(--warm-white)", color: "var(--black)", display: "flex", flexDirection: "column", padding: "1.5rem" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
          <h2 style={{ fontSize: "1.1rem", fontWeight: 900, letterSpacing: "0.16em" }}>{t("yourBag")}</h2>
          <button onClick={() => setCartOpen(false)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.4rem" }}>×</button>
        </div>
        <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          {items.length === 0 && <p style={{ color: "var(--muted)" }}>{t("bagEmpty")}</p>}
          {items.map((item) => (
            <div key={item.id} style={{ display: "grid", gridTemplateColumns: "80px 1fr auto", gap: "0.85rem" }}>
              <img src={item.image} alt="" style={{ width: "80px", height: "106px", objectFit: "cover", background: "var(--sand)" }} />
              <div>
                <Link href={`/product/${item.slug}`} onClick={() => setCartOpen(false)} style={{ fontWeight: 700, textDecoration: "none", color: "inherit", fontSize: "0.9rem" }}>
                  {item.name}
                </Link>
                <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "0.25rem" }}>
                  {[item.size, item.color].filter(Boolean).join(" · ")}
                </p>
                <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginTop: "0.6rem" }}>
                  <button onClick={() => update(item.id, item.quantity - 1)} style={qtyBtn}>−</button>
                  <span>{item.quantity}</span>
                  <button onClick={() => update(item.id, item.quantity + 1)} style={qtyBtn}>+</button>
                </div>
              </div>
              <div style={{ textAlign: dir === "rtl" ? "left" : "right" }}>
                <p style={{ fontWeight: 700, fontSize: "0.85rem" }}>{formatQar(item.price * item.quantity)}</p>
                <button onClick={() => remove(item.id)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "0.65rem", marginTop: "0.5rem", cursor: "pointer" }}>{t("remove")}</button>
              </div>
            </div>
          ))}
        </div>
        <div style={{ borderTop: "1px solid var(--sand)", paddingTop: "1rem" }}>
          <p style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.4rem" }}>
            <span>{t("subtotal")}</span><strong>{formatQar(subtotal)}</strong>
          </p>
          <p style={{ display: "flex", justifyContent: "space-between", color: "var(--muted)", fontSize: "0.85rem", marginBottom: "1rem" }}>
            <span>{t("shipping")}</span><span>{shipping === 0 ? t("free") : formatQar(shipping)}</span>
          </p>
          <Link href="/cart" onClick={() => setCartOpen(false)} className="btn-outline-black" style={{ width: "100%", marginBottom: "0.6rem" }}>{t("viewBag")}</Link>
          <Link href="/checkout" onClick={() => setCartOpen(false)} className="btn-gold" style={{ width: "100%" }}>{t("checkout")}</Link>
        </div>
      </aside>
    </div>
  );
}

const qtyBtn: React.CSSProperties = {
  width: 24,
  height: 24,
  border: "1px solid var(--sand)",
  background: "transparent",
  cursor: "pointer",
};
