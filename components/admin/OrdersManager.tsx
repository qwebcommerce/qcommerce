"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminSelect from "@/components/admin/AdminSelect";
import { updateOrderPaymentAction, updateOrderStatusAction } from "@/lib/actions";
import { formatDate, formatQar } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { useToast } from "@/lib/toast";
import { FULFILLMENT_STATUSES, type Order, type OrderStatus, type PaymentStatus } from "@/types";
import type { MessageKey } from "@/lib/i18n";

const PAGE_SIZE = 8;

function fulfillmentOptions(current: OrderStatus): OrderStatus[] {
  return current === "paid" ? ["paid", ...FULFILLMENT_STATUSES] : FULFILLMENT_STATUSES;
}

export default function OrdersManager({ orders }: { orders: Order[] }) {
  const { t, locale } = usePreferences();
  const toast = useToast();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return orders.filter((order) => {
      if (statusFilter !== "all" && order.status !== statusFilter) return false;
      if (paymentFilter !== "all" && order.paymentStatus !== paymentFilter) return false;
      if (!needle) return true;
      const haystack = [
        order.orderNumber,
        order.customerName,
        order.email,
        order.shippingAddress.phone ?? "",
        order.status,
        order.paymentStatus,
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [orders, query, statusFilter, paymentFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter, paymentFilter]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function run(
    id: string,
    action: (form: FormData) => Promise<{ ok?: true; error?: string }>,
    form: FormData,
    success: string,
  ) {
    setBusyId(id);
    startTransition(async () => {
      const result = await action(form);
      setBusyId("");
      if (result.error) {
        toast.error(t("toastError"), result.error);
        return;
      }
      toast.success(success);
      router.refresh();
    });
  }

  function changeStatus(order: Order, status: OrderStatus) {
    if (status === order.status) return;
    const form = new FormData();
    form.set("id", order.id);
    form.set("status", status);
    run(order.id, updateOrderStatusAction, form, t("toastOrderUpdated"));
  }

  function changePayment(order: Order, paymentStatus: PaymentStatus) {
    if (paymentStatus === order.paymentStatus) return;
    const form = new FormData();
    form.set("id", order.id);
    form.set("paymentStatus", paymentStatus);
    run(order.id, updateOrderPaymentAction, form, t("toastPaymentUpdated"));
  }

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">{t("admin")}</p>
          <h1 className="admin-title">{t("ordersNav")}</h1>
        </div>
      </div>
      <p className="admin-lead">{t("ordersIntro")}</p>

      {orders.length > 0 ? (
        <div className="admin-toolbar">
          <label className="admin-search">
            <SearchIcon />
            <span className="sr-only">{t("orderSearch")}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("orderSearch")}
            />
          </label>
          <AdminSelect
            className="admin-filter"
            value={statusFilter}
            onChange={setStatusFilter}
            aria-label={t("orderStatus")}
            options={[
              { value: "all", label: t("allStatuses") },
              ...FULFILLMENT_STATUSES.map((status) => ({
                value: status,
                label: t(status as MessageKey),
              })),
            ]}
          />
          <AdminSelect
            className="admin-filter"
            value={paymentFilter}
            onChange={setPaymentFilter}
            aria-label={t("paymentMethod")}
            options={[
              { value: "all", label: t("allPayments") },
              { value: "paid", label: t("paid") },
              { value: "unpaid", label: t("unpaid") },
            ]}
          />
        </div>
      ) : null}

      {orders.length === 0 ? (
        <section className="admin-panel">
          <p className="admin-empty">{t("noOrdersAdmin")}</p>
        </section>
      ) : filtered.length === 0 ? (
        <section className="admin-panel">
          <p className="admin-empty">{t("noOrdersMatch")}</p>
        </section>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("ordersNav")}</th>
                  <th>{t("dateCol")}</th>
                  <th>{t("paymentMethod")}</th>
                  <th>{t("status")}</th>
                  <th>{t("total")}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((order) => {
                  const busy = pending && busyId === order.id;
                  return (
                    <tr key={order.id}>
                      <td>
                        <div className="admin-table__product">
                          <div>
                            <strong>{order.orderNumber}</strong>
                            <span>
                              {order.customerName} · {order.customerId ? t("accountCheckout") : t("guestCheckout")}
                            </span>
                            <span>{order.email}</span>
                            <div className="admin-table__actions">
                              <Link href={`/admin/orders/${order.id}`} className="admin-text-btn">
                                {t("viewOrder")}
                              </Link>
                              {order.paymentStatus === "paid" ? (
                                <button
                                  type="button"
                                  className="admin-text-btn"
                                  disabled={busy}
                                  onClick={() => changePayment(order, "unpaid")}
                                >
                                  {t("markUnpaid")}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="admin-text-btn admin-text-btn--gold"
                                  disabled={busy}
                                  onClick={() => changePayment(order, "paid")}
                                >
                                  {t("markPaid")}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td data-label={t("dateCol")}>{formatDate(order.createdAt, locale)}</td>
                      <td data-label={t("paymentMethod")}>
                        <StatusBadge status={order.paymentStatus} label={t(order.paymentStatus as MessageKey)} />
                      </td>
                      <td data-label={t("status")}>
                        <AdminSelect
                          className="admin-select--compact"
                          value={order.status}
                          disabled={busy}
                          onChange={(status) => changeStatus(order, status as OrderStatus)}
                          aria-label={t("orderStatus")}
                          options={fulfillmentOptions(order.status).map((status) => ({
                            value: status,
                            label: t(status as MessageKey),
                          }))}
                        />
                      </td>
                      <td data-label={t("total")}>{formatQar(order.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          <div className="admin-pager">
            <p>{t("showingCount", { from, to, total: filtered.length })}</p>
            <div className="admin-pager__btns">
              <button type="button" className="admin-text-btn" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                {t("previous")}
              </button>
              <span>{t("pageOf", { page: currentPage, pages: pageCount })}</span>
              <button type="button" className="admin-text-btn" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>
                {t("next")}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
