"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { updateCustomerProfileAction } from "@/lib/actions";
import { formatDate, formatQar } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { useToast } from "@/lib/toast";
import {
  composeGulfPhone,
  GULF_DIALS,
  parseGulfPhone,
  splitGulfPhone,
} from "@/lib/validation";
import type { Order } from "@/types";

type ProfileCustomer = { fullName: string; email: string; phone: string };

export default function AccountView({
  customer,
  orders,
}: {
  customer: ProfileCustomer;
  orders: Order[];
}) {
  const { t } = usePreferences();

  return (
    <div>
      <header className="account-dash__head">
        <div>
          <span className="section-eyebrow">{t("account")}</span>
          <h1 className="section-title">{t("dashboard")}</h1>
          <p className="account-dash__hello">{t("hello", { name: customer.fullName })}</p>
        </div>
      </header>

      <div className="account-dash">
        <section className="account-card">
          <div className="account-card__head">
            <h2>{t("yourProfile")}</h2>
            <Link href="/account/profile">{t("edit")}</Link>
          </div>
          <p className="account-profile-summary">
            <strong>{customer.fullName}</strong>
            <span>{customer.email}</span>
            {customer.phone ? <span>{customer.phone}</span> : null}
          </p>
        </section>

        <section className="account-card">
          <div className="account-card__head">
            <h2>{t("orderHistory")}</h2>
            {orders.length > 0 ? <Link href="/account/orders">{t("viewAll")}</Link> : null}
          </div>
          <OrderList orders={orders.slice(0, 6)} />
        </section>
      </div>
    </div>
  );
}

export function AccountOrdersView({ orders }: { orders: Order[] }) {
  const { t } = usePreferences();
  return (
    <div>
      <header className="account-dash__head">
        <div>
          <span className="section-eyebrow">{t("account")}</span>
          <h1 className="section-title">{t("orderHistory")}</h1>
        </div>
      </header>
      <section className="account-card">
        <OrderList orders={orders} />
      </section>
    </div>
  );
}

export function AccountProfileView({ customer }: { customer: ProfileCustomer }) {
  const { t } = usePreferences();
  return (
    <div>
      <header className="account-dash__head">
        <div>
          <span className="section-eyebrow">{t("account")}</span>
          <h1 className="section-title">{t("yourProfile")}</h1>
        </div>
      </header>
      <section className="account-card" style={{ maxWidth: 480 }}>
        <AccountProfileForm customer={customer} />
      </section>
    </div>
  );
}

function OrderList({ orders }: { orders: Order[] }) {
  const { t, locale } = usePreferences();
  if (orders.length === 0) {
    return <p className="account-dash__empty">{t("noOrders")}</p>;
  }
  return (
    <div className="account-orders">
      {orders.map((order) => (
        <Link key={order.id} href={`/account/orders/${order.id}`} className="account-order">
          <div>
            <strong>{order.orderNumber}</strong>
            <span>
              {formatDate(order.createdAt, locale)} · {order.items.length} {t("items")}
            </span>
          </div>
          <div className="account-order__meta">
            <span className={`status-pill status-pill--${order.status}`}>{order.status}</span>
            <em>{formatQar(order.total)}</em>
          </div>
        </Link>
      ))}
    </div>
  );
}

function AccountProfileForm({ customer }: { customer: ProfileCustomer }) {
  const { t } = usePreferences();
  const toast = useToast();
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const initial = splitGulfPhone(customer.phone);
  const [phoneCode, setPhoneCode] = useState(initial.code);
  const [phoneLocal, setPhoneLocal] = useState(initial.local);

  useEffect(() => {
    const parsed = splitGulfPhone(customer.phone);
    setPhoneCode(parsed.code);
    setPhoneLocal(parsed.local);
  }, [customer.phone]);

  const dial = GULF_DIALS.find((item) => item.code === phoneCode) ?? GULF_DIALS[0];

  return (
    <form
      className="account-profile"
      action={async (formData) => {
        const local = String(formData.get("phoneLocal") ?? "").trim();
        if (local && !composeGulfPhone(String(formData.get("phoneCode") ?? ""), local)) {
          const message = t("invalidPhone");
          setError(message);
          toast.error(t("toastError"), message);
          return;
        }
        setPending(true);
        setError("");
        const result = await updateCustomerProfileAction(formData);
        setPending(false);
        if (result?.error) {
          setError(result.error);
          toast.error(t("toastError"), result.error);
          return;
        }
        toast.success(t("toastProfileSaved"));
        router.refresh();
      }}
    >
      <label>
        <span>{t("fullName")}</span>
        <input name="fullName" required defaultValue={customer.fullName} className="field-input" />
      </label>
      <label>
        <span>{t("email")}</span>
        <input value={customer.email} readOnly className="field-input" />
      </label>
      <div className="checkout-phone">
        <label>
          <span>{t("phone")}</span>
          <select
            name="phoneCode"
            className="field-select"
            value={phoneCode}
            onChange={(event) => setPhoneCode(event.target.value)}
            aria-label={t("phone")}
          >
            {GULF_DIALS.map((item) => (
              <option key={item.code} value={item.code}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <label>
          <span>{t("phoneLocal")}</span>
          <input
            name="phoneLocal"
            type="tel"
            className="field-input"
            value={phoneLocal}
            placeholder={t("phoneOptional")}
            inputMode="numeric"
            autoComplete="tel-national"
            maxLength={dial.digits}
            onChange={(event) => {
              const raw = event.target.value;
              const parsed = parseGulfPhone(raw);
              if (parsed) {
                setPhoneCode(parsed.code);
                setPhoneLocal(parsed.local);
                return;
              }
              setPhoneLocal(raw.replace(/\D/g, ""));
            }}
          />
        </label>
      </div>
      {error ? <p className="account-profile__error">{error}</p> : null}
      <button className="btn-gold" disabled={pending} type="submit">
        {pending ? t("saving") : t("saveProfile")}
      </button>
    </form>
  );
}
