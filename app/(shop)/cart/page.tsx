"use client";

import Link from "next/link";
import { useCommerceSettings } from "@/lib/commerce-settings";
import { formatQar, shippingFor } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { useCart } from "@/lib/store";

export default function CartPage() {
  const { items, subtotal, update, remove } = useCart();
  const { t } = usePreferences();
  const shipping = shippingFor(subtotal, useCommerceSettings());

  return (
    <section className="page-section cart-page">
      <h1 className="section-title cart-page__title">{t("yourBag")}</h1>
      {items.length === 0 ? (
        <div className="cart-empty">
          <p>{t("bagEmpty")}</p>
          <Link href="/shop" className="btn-gold">
            {t("continueShopping")}
          </Link>
        </div>
      ) : (
        <div className="cart-layout">
          <div className="cart-lines">
            {items.map((item) => (
              <article key={item.id} className="cart-line">
                <img src={item.image} alt="" className="cart-line__image" />
                <div className="cart-line__info">
                  <Link href={`/product/${item.slug}`}>{item.name}</Link>
                  <p>{[item.size, item.color].filter(Boolean).join(" · ")}</p>
                  <div className="cart-line__qty">
                    <button type="button" onClick={() => update(item.id, item.quantity - 1)} className="cart-qty" aria-label="−">
                      −
                    </button>
                    <span>{item.quantity}</span>
                    <button type="button" onClick={() => update(item.id, item.quantity + 1)} className="cart-qty" aria-label="+">
                      +
                    </button>
                  </div>
                </div>
                <div className="cart-line__meta">
                  <p>{formatQar(item.price * item.quantity)}</p>
                  <button type="button" onClick={() => remove(item.id)} className="cart-line__remove">
                    {t("remove")}
                  </button>
                </div>
              </article>
            ))}
          </div>
          <aside className="cart-summary">
            <p>
              <span>{t("subtotal")}</span>
              <strong>{formatQar(subtotal)}</strong>
            </p>
            <p className="cart-summary__shipping">
              <span>{t("shipping")}</span>
              <span>{shipping === 0 ? t("free") : formatQar(shipping)}</span>
            </p>
            <Link href="/checkout" className="btn-gold">
              {t("checkout")}
            </Link>
          </aside>
        </div>
      )}
    </section>
  );
}
