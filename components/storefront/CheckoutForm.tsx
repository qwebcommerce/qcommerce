"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { applyPromoAction, placeOrderAction } from "@/lib/actions";
import { useCommerceSettings } from "@/lib/commerce-settings";
import { formatQar, promoDiscount, promoIsActive, shippingFor } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { useCart } from "@/lib/store";
import { useToast } from "@/lib/toast";
import {
  composeGulfPhone,
  GULF_DIALS,
  gulfDialForCode,
  gulfDialForCountry,
  isValidEmail,
  parseGulfPhone,
  splitGulfPhone,
  type GulfDial,
} from "@/lib/validation";
import { theme } from "@/theme.config";

const DRAFT_KEY = "qc_checkout_draft";

type CheckoutCustomer = {
  fullName: string;
  email: string;
  phone: string;
};

type Draft = {
  customerName?: string;
  email?: string;
  phone?: string;
  line1?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  area?: string;
  notes?: string;
};

function readDraft(): Draft {
  if (typeof window === "undefined") return {};
  try {
    const raw = sessionStorage.getItem(DRAFT_KEY);
    return raw ? (JSON.parse(raw) as Draft) : {};
  } catch {
    return {};
  }
}

function saveDraft(form: HTMLFormElement, extra?: Draft) {
  const data = Object.fromEntries(new FormData(form).entries());
  sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ ...data, ...extra }));
}

export default function CheckoutForm({ customer }: { customer: CheckoutCustomer | null }) {
  const { items, subtotal, clear } = useCart();
  const { t } = usePreferences();
  const toast = useToast();
  const settings = useCommerceSettings();
  const shipping = shippingFor(subtotal, settings);
  const promoEnabled = promoIsActive(settings);
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const [draft, setDraft] = useState<Draft>({});
  const [formKey, setFormKey] = useState("boot");
  const [phoneCode, setPhoneCode] = useState<GulfDial["code"]>(GULF_DIALS[0].code);
  const [phoneLocal, setPhoneLocal] = useState("");
  const [promoInput, setPromoInput] = useState("");
  const [promoBusy, setPromoBusy] = useState(false);
  const [appliedPromo, setAppliedPromo] = useState<{ code: string; percent: number } | null>(null);
  const discount = appliedPromo ? promoDiscount(subtotal, appliedPromo.percent) : 0;
  const signedIn = Boolean(customer);

  useEffect(() => {
    const next = readDraft();
    const parsed = splitGulfPhone(
      customer?.phone || next.phone || "",
      next.country || theme.commerce.checkoutCountries[0],
    );
    setDraft(next);
    setPhoneCode(gulfDialForCode(parsed.code).code);
    setPhoneLocal(parsed.local);
    setFormKey("ready");
  }, [customer]);

  async function applyPromo(form: HTMLFormElement | null) {
    const email = customer?.email || String(form ? new FormData(form).get("email") ?? "" : "");
    if (!isValidEmail(email)) {
      const message = t("invalidEmail");
      setError(message);
      toast.error(t("promoInvalid"), message);
      return;
    }
    setPromoBusy(true);
    setError("");
    const result = await applyPromoAction(promoInput, email);
    setPromoBusy(false);
    if (!result.ok) {
      const message = result.error ?? t("promoInvalid");
      setAppliedPromo(null);
      setError(message);
      toast.error(t("promoInvalid"), message);
      return;
    }
    setAppliedPromo({ code: result.code, percent: result.percent });
    toast.success(t("promoApplied"));
  }

  if (formKey === "boot") {
    return (
      <section className="page-section">
        <h1 className="section-title">{t("checkoutTitle")}</h1>
      </section>
    );
  }

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
          const form = e.currentTarget;
          const email = customer?.email || String(new FormData(form).get("email") ?? "");
          const phone = composeGulfPhone(phoneCode, phoneLocal);
          if (!isValidEmail(email)) {
            const message = t("invalidEmail");
            setError(message);
            toast.error(t("orderFailed"), message);
            return;
          }
          if (!phone) {
            const message = t("invalidPhone");
            setError(message);
            toast.error(t("orderFailed"), message);
            return;
          }
          setPending(true);
          setError("");
          const data = new FormData(form);
          const result = await placeOrderAction({
            email,
            customerName: String(data.get("customerName") ?? ""),
            notes: String(data.get("notes") ?? ""),
            paymentMethod: "cod",
            promoCode: appliedPromo?.code,
            shippingAddress: {
              line1: String(data.get("line1") ?? ""),
              city: String(data.get("city") ?? ""),
              country: String(data.get("country") ?? ""),
              postalCode: String(data.get("postalCode") ?? ""),
              area: String(data.get("area") ?? ""),
              phone,
            },
            items: items.map(({ productId, name, slug, image, price, quantity, size, color, variantId, source, supplierProductId, supplierUrl }) => ({
              productId, name, slug, image, price, quantity, size, color, variantId, source, supplierProductId, supplierUrl,
            })),
          });
          setPending(false);
          if (result.error || !result.orderNumber) {
            const message = result.error ?? t("orderFailed");
            setError(message);
            toast.error(t("orderFailed"), message);
            return;
          }
          sessionStorage.removeItem(DRAFT_KEY);
          clear();
          if (result.emailFailed) {
            toast.error(t("orderEmailFailed"), t("orderEmailFailedBody"));
          }
          router.push(`/checkout/success?order=${encodeURIComponent(result.orderNumber)}`);
        }}
        className="checkout-grid"
        key={`${formKey}-${customer?.email ?? "guest"}`}
      >
        <div className="checkout-fields">
          {signedIn ? (
            <div className="checkout-register checkout-register--account">
              <strong>{t("signedInAs", { name: customer!.fullName })}</strong>
              <p>{t("checkoutAccountOrder")}</p>
            </div>
          ) : (
            <div className="checkout-register">
              <strong>{t("checkoutRegisterTitle")}</strong>
              <p>{t("checkoutRegisterBody")}</p>
              <p className="checkout-guest-note">{t("checkoutGuestHint")}</p>
              <div className="checkout-register__actions">
                <Link
                  href="/account/register?next=/checkout"
                  className="btn-gold"
                  onClick={(event) => {
                    const form = event.currentTarget.closest("form");
                    if (form) saveDraft(form, { phone: composeGulfPhone(phoneCode, phoneLocal) || `${phoneCode}${phoneLocal}` });
                  }}
                >
                  {t("createAccount")}
                </Link>
                <Link
                  href="/account/login?next=/checkout"
                  className="btn-outline-black"
                  onClick={(event) => {
                    const form = event.currentTarget.closest("form");
                    if (form) saveDraft(form, { phone: composeGulfPhone(phoneCode, phoneLocal) || `${phoneCode}${phoneLocal}` });
                  }}
                >
                  {t("checkoutSignIn")}
                </Link>
              </div>
            </div>
          )}
          <input
            name="customerName"
            required
            placeholder={t("fullName")}
            className="field-input"
            defaultValue={customer?.fullName || draft.customerName || ""}
          />
          <input
            name="email"
            type="email"
            required
            placeholder={t("email")}
            className="field-input"
            defaultValue={customer?.email || draft.email || ""}
            readOnly={signedIn}
            onBlur={(event) => {
              if (!signedIn && event.target.value && !isValidEmail(event.target.value)) {
                setError(t("invalidEmail"));
              }
            }}
          />
          <div className="checkout-phone">
            <label className="sr-only">{t("phone")}</label>
            <select
              className="admin-select"
              value={phoneCode}
              onChange={(event) => setPhoneCode(gulfDialForCode(event.target.value).code)}
              aria-label={t("phone")}
            >
              {GULF_DIALS.map((dial) => (
                <option key={dial.code} value={dial.code}>{dial.label}</option>
              ))}
            </select>
            <input
              type="tel"
              required
              placeholder={t("phoneLocal")}
              className="field-input"
              value={phoneLocal}
              onChange={(event) => {
                const raw = event.target.value;
                const parsed = parseGulfPhone(raw);
                if (parsed) {
                  setPhoneCode(gulfDialForCode(parsed.code).code);
                  setPhoneLocal(parsed.local);
                  return;
                }
                setPhoneLocal(raw.replace(/\D/g, ""));
              }}
              inputMode="numeric"
              autoComplete="tel-national"
              maxLength={GULF_DIALS.find((dial) => dial.code === phoneCode)?.digits ?? 9}
            />
          </div>
          <input
            name="line1"
            required
            placeholder={t("address")}
            className="field-input"
            defaultValue={draft.line1 || ""}
          />
          <input
            name="city"
            required
            placeholder={t("city")}
            className="field-input"
            defaultValue={draft.city || ""}
          />
          <select
            name="country"
            className="admin-select"
            defaultValue={draft.country || theme.commerce.checkoutCountries[0]}
            onChange={(event) => setPhoneCode(gulfDialForCountry(event.target.value).code)}
          >
            {theme.commerce.checkoutCountries.map((country) => (
              <option key={country}>{country}</option>
            ))}
          </select>
          <textarea
            name="notes"
            placeholder={t("orderNote")}
            className="admin-textarea"
            rows={3}
            defaultValue={draft.notes || ""}
          />
          {error && <p style={{ color: "var(--sale)" }}>{error}</p>}
        </div>
        <aside className="checkout-summary">
          {items.map((item) => (
            <p key={item.id} className="checkout-line">
              <span>{item.name} × {item.quantity}</span>
              <span>{formatQar(item.price * item.quantity)}</span>
            </p>
          ))}
          <p className="checkout-line"><span>{t("subtotal")}</span><span>{formatQar(subtotal)}</span></p>
          {promoEnabled ? (
            <div className="checkout-promo">
              <input
                className="field-input"
                placeholder={t("promoPlaceholder")}
                value={promoInput}
                onChange={(event) => {
                  setPromoInput(event.target.value.toUpperCase());
                  setAppliedPromo(null);
                }}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    applyPromo(event.currentTarget.form);
                  }
                }}
                autoComplete="off"
              />
              <button
                type="button"
                className="btn-outline-black"
                disabled={promoBusy || pending}
                onClick={(event) => applyPromo(event.currentTarget.form)}
              >
                {promoBusy ? t("saving") : t("applyPromo")}
              </button>
            </div>
          ) : null}
          <label className="checkout-cod">
            <input type="hidden" name="paymentMethod" value="cod" />
            <input type="checkbox" defaultChecked disabled readOnly aria-disabled="true" />
            <span>
              <strong>{t("cashOnDelivery")}</strong>
              <em>{t("codHint")}</em>
            </span>
          </label>
          <p className="checkout-line"><span>{t("shipping")}</span><span>{shipping === 0 ? t("free") : formatQar(shipping)}</span></p>
          {discount > 0 && appliedPromo ? (
            <p className="checkout-line checkout-line--discount">
              <span>{t("discount")} · {appliedPromo.code}</span>
              <span>−{formatQar(discount)}</span>
            </p>
          ) : null}
          <p className="checkout-line checkout-line--total"><span>{t("total")}</span><span>{formatQar(Math.max(0, subtotal - discount + shipping))}</span></p>
          <button type="submit" className="btn-gold" style={{ width: "100%" }} disabled={pending}>
            {pending ? t("placingOrder") : t("placeOrder")}
          </button>
        </aside>
      </form>
    </section>
  );
}
