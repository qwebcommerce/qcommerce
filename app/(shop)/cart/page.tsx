"use client";

import Link from "next/link";
import { formatQar, shippingFor } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { useCart } from "@/lib/store";

export default function CartPage() {
  const { items, subtotal, update, remove } = useCart();
  const { t } = usePreferences();
  const shipping = shippingFor(subtotal);

  return (
    <section className="page-section">
      <h1 className="section-title" style={{ marginBottom: "2rem" }}>{t("yourBag")}</h1>
      {items.length === 0 ? (
        <>
          <p style={{ color: "var(--muted)", marginBottom: "2rem" }}>{t("bagEmpty")}</p>
          <Link href="/shop" className="btn-gold">{t("continueShopping")}</Link>
        </>
      ) : (
        <div style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "3rem" }} className="max-md:grid-cols-1">
          <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
            {items.map((item) => (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "100px 1fr auto", gap: "1.5rem", borderBottom: "1px solid var(--sand)", paddingBottom: "1.5rem" }}>
                <img src={item.image} alt="" style={{ width: 100, height: 133, objectFit: "cover" }} />
                <div>
                  <Link href={`/product/${item.slug}`} style={{ fontWeight: 700, textDecoration: "none", color: "inherit" }}>{item.name}</Link>
                  <p style={{ color: "var(--muted)", fontSize: "0.8rem", marginTop: "0.3rem" }}>{[item.size, item.color].filter(Boolean).join(" · ")}</p>
                  <div style={{ display: "flex", gap: "0.6rem", alignItems: "center", marginTop: "0.8rem" }}>
                    <button onClick={() => update(item.id, item.quantity - 1)} className="filter-tab">−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => update(item.id, item.quantity + 1)} className="filter-tab">+</button>
                  </div>
                </div>
                <div>
                  <p style={{ fontWeight: 700 }}>{formatQar(item.price * item.quantity)}</p>
                  <button onClick={() => remove(item.id)} style={{ background: "none", border: "none", color: "var(--muted)", fontSize: "0.7rem", marginTop: "0.6rem", cursor: "pointer" }}>{t("remove")}</button>
                </div>
              </div>
            ))}
          </div>
          <aside>
            <p style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}><span>{t("subtotal")}</span><strong>{formatQar(subtotal)}</strong></p>
            <p style={{ display: "flex", justifyContent: "space-between", marginBottom: "1.5rem", color: "var(--muted)" }}><span>{t("shipping")}</span><span>{shipping === 0 ? t("free") : formatQar(shipping)}</span></p>
            <Link href="/checkout" className="btn-gold" style={{ width: "100%" }}>{t("checkout")}</Link>
          </aside>
        </div>
      )}
    </section>
  );
}
