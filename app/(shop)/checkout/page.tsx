"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { placeOrderAction } from "@/lib/actions";
import { formatQar, shippingFor } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { useCart } from "@/lib/store";
import { theme } from "@/theme.config";

export default function CheckoutPage() {
  const { items, subtotal, clear } = useCart();
  const { t } = usePreferences();
  const shipping = shippingFor(subtotal);
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  if (items.length === 0) {
    return (
      <section className="page-section">
        <h1 className="section-title">{t("checkoutTitle")}</h1>
        <p style={{ marginTop: "1.5rem", color: "var(--muted)" }}>{t("bagEmpty")}</p>
      </section>
    );
  }

  return (
    <section className="page-section">
      <h1 className="section-title" style={{ marginBottom: "2rem" }}>{t("checkoutTitle")}</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          setPending(true);
          setError("");
          const form = new FormData(e.currentTarget);
          const result = await placeOrderAction({
            email: String(form.get("email") ?? ""),
            customerName: String(form.get("customerName") ?? ""),
            notes: String(form.get("notes") ?? ""),
            shippingAddress: {
              line1: String(form.get("line1") ?? ""),
              city: String(form.get("city") ?? ""),
              country: String(form.get("country") ?? ""),
              phone: String(form.get("phone") ?? ""),
            },
            items: items.map(({ productId, name, slug, image, price, quantity, size, color }) => ({
              productId, name, slug, image, price, quantity, size, color,
            })),
          });
          setPending(false);
          if (result.error || !result.orderId) {
            setError(result.error ?? t("orderFailed"));
            return;
          }
          clear();
          router.push(`/account/orders/${result.orderId}?placed=1`);
        }}
        style={{ display: "grid", gridTemplateColumns: "1fr 340px", gap: "3rem" }}
        className="max-md:grid-cols-1"
      >
        <div style={{ display: "flex", flexDirection: "column", gap: "1.2rem" }}>
          <input name="customerName" required placeholder={t("fullName")} className="field-input" />
          <input name="email" type="email" required placeholder={t("email")} className="field-input" />
          <input name="phone" placeholder={t("phone")} className="field-input" />
          <input name="line1" required placeholder={t("address")} className="field-input" />
          <input name="city" required placeholder={t("city")} className="field-input" />
          <select name="country" className="admin-select" defaultValue={theme.commerce.checkoutCountries[0]}>
            {theme.commerce.checkoutCountries.map((c) => <option key={c}>{c}</option>)}
          </select>
          <textarea name="notes" placeholder={t("orderNote")} className="admin-textarea" rows={3} />
          {error && <p style={{ color: "var(--sale)" }}>{error}</p>}
        </div>
        <aside>
          {items.map((item) => (
            <p key={item.id} style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem", fontSize: "0.9rem" }}>
              <span>{item.name} × {item.quantity}</span>
              <span>{formatQar(item.price * item.quantity)}</span>
            </p>
          ))}
          <p style={{ display: "flex", justifyContent: "space-between", marginTop: "1rem" }}><span>{t("shipping")}</span><span>{shipping === 0 ? t("free") : formatQar(shipping)}</span></p>
          <p style={{ display: "flex", justifyContent: "space-between", fontWeight: 800, margin: "1rem 0 1.5rem" }}><span>{t("total")}</span><span>{formatQar(subtotal + shipping)}</span></p>
          <button type="submit" className="btn-gold" style={{ width: "100%" }} disabled={pending}>
            {pending ? t("placingOrder") : t("placeOrder")}
          </button>
        </aside>
      </form>
    </section>
  );
}
