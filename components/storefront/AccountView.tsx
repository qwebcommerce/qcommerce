"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import StatusBadge from "@/components/admin/StatusBadge";
import { updateCustomerProfileAction } from "@/lib/actions";
import { formatDate, formatQar } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { useToast } from "@/lib/toast";
import type { Order } from "@/types";

export default function AccountView({
  customer,
  orders,
}: {
  customer: { fullName: string; email: string; phone: string };
  orders: Order[];
}) {
  const { t, locale } = usePreferences();
  const toast = useToast();
  const router = useRouter();
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  const pendingOrders = orders.filter((order) => order.status === "pending" || order.status === "processing").length;
  const spent = orders.filter((order) => order.status !== "cancelled").reduce((sum, order) => sum + order.total, 0);

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">{t("account")}</p>
          <h1 className="admin-title">{t("dashboard")}</h1>
        </div>
        <p className="admin-updated">{t("hello", { name: customer.fullName })}</p>
      </div>

      <div className="admin-stat-grid account-stat-grid">
        <article className="admin-stat">
          <div className="admin-stat__top">
            <p>{t("ordersNav")}</p>
          </div>
          <strong>{orders.length}</strong>
          <span>{t("pendingCount", { count: pendingOrders })}</span>
        </article>
        <article className="admin-stat">
          <div className="admin-stat__top">
            <p>{t("pending")}</p>
          </div>
          <strong>{pendingOrders}</strong>
          <span>{t("orderStatus")}</span>
        </article>
        <article className="admin-stat">
          <div className="admin-stat__top">
            <p>{t("spent")}</p>
          </div>
          <strong>{formatQar(spent)}</strong>
          <span>{t("orderHistory")}</span>
        </article>
      </div>

      <div className="admin-split">
        <section className="admin-panel" id="orders">
          <div className="admin-panel__head">
            <h2>{t("orderHistory")}</h2>
          </div>
          {orders.length === 0 ? (
            <p className="admin-empty">{t("noOrders")}</p>
          ) : (
            <div className="admin-order-list">
              {orders.map((order) => (
                <Link key={order.id} href={`/account/orders/${order.id}`} className="admin-order-row">
                  <div>
                    <strong>{order.orderNumber}</strong>
                    <span>{formatDate(order.createdAt, locale)}</span>
                  </div>
                  <StatusBadge status={order.status} />
                  <em>{order.items.length} {t("items")}</em>
                  <b>{formatQar(order.total)}</b>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="admin-panel" id="profile">
          <div className="admin-panel__head">
            <h2>{t("yourProfile")}</h2>
          </div>
          <form
            className="account-profile"
            action={async (formData) => {
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
              <input name="fullName" required defaultValue={customer.fullName} className="admin-input" />
            </label>
            <label>
              <span>{t("email")}</span>
              <input value={customer.email} readOnly className="admin-input" />
            </label>
            <label>
              <span>{t("phone")}</span>
              <input name="phone" defaultValue={customer.phone} placeholder={t("phoneOptional")} className="admin-input" />
            </label>
            {error ? <p className="account-profile__error">{error}</p> : null}
            <div className="admin-form-actions">
              <button className="btn-gold" disabled={pending} type="submit">
                {pending ? t("saving") : t("saveProfile")}
              </button>
            </div>
          </form>
        </section>
      </div>
    </div>
  );
}
