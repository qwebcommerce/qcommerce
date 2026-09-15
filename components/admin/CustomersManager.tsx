"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminSelect from "@/components/admin/AdminSelect";
import { updateCustomerStatusAction } from "@/lib/actions";
import { formatDate } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { useToast } from "@/lib/toast";
import type { Customer, CustomerStatus } from "@/types";

const PAGE_SIZE = 8;

export default function CustomersManager({ customers }: { customers: Customer[] }) {
  const { t, locale } = usePreferences();
  const toast = useToast();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();
  const [busyId, setBusyId] = useState("");

  const shoppers = useMemo(
    () => customers.filter((customer) => customer.role !== "admin"),
    [customers],
  );

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return shoppers.filter((customer) => {
      if (statusFilter !== "all" && customer.status !== statusFilter) return false;
      if (!needle) return true;
      const haystack = [customer.fullName, customer.email, customer.phone, customer.status].join(" ").toLowerCase();
      return haystack.includes(needle);
    });
  }, [shoppers, query, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [query, statusFilter]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function changeStatus(customer: Customer, status: CustomerStatus) {
    if (status === customer.status) return;
    const form = new FormData();
    form.set("id", customer.id);
    form.set("status", status);
    setBusyId(customer.id);
    startTransition(async () => {
      const result = await updateCustomerStatusAction(form);
      setBusyId("");
      if (result.error) {
        toast.error(t("toastError"), result.error);
        return;
      }
      toast.success(t("toastCustomerUpdated"));
      router.refresh();
    });
  }

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">{t("admin")}</p>
          <h1 className="admin-title">{t("customersNav")}</h1>
        </div>
      </div>
      <p className="admin-lead">{t("customersIntro")}</p>

      {shoppers.length > 0 ? (
        <div className="admin-toolbar">
          <label className="admin-search">
            <SearchIcon />
            <span className="sr-only">{t("customerSearch")}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("customerSearch")}
            />
          </label>
          <AdminSelect
            className="admin-filter"
            value={statusFilter}
            onChange={setStatusFilter}
            aria-label={t("status")}
            options={[
              { value: "all", label: t("allStatuses") },
              { value: "active", label: t("active") },
              { value: "blocked", label: t("blocked") },
            ]}
          />
        </div>
      ) : null}

      {shoppers.length === 0 ? (
        <section className="admin-panel">
          <p className="admin-empty">{t("noCustomersAdmin")}</p>
        </section>
      ) : filtered.length === 0 ? (
        <section className="admin-panel">
          <p className="admin-empty">{t("noCustomersMatch")}</p>
        </section>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("name")}</th>
                  <th>{t("phone")}</th>
                  <th>{t("joined")}</th>
                  <th>{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((customer) => {
                  const busy = pending && busyId === customer.id;
                  return (
                    <tr key={customer.id}>
                      <td>
                        <div className="admin-table__product">
                          <div>
                            <strong>{customer.fullName}</strong>
                            <span>{customer.email}</span>
                            <div className="admin-table__actions">
                              <Link href={`/admin/customers/${customer.id}`} className="admin-text-btn">
                                {t("viewCustomer")}
                              </Link>
                              {customer.status === "blocked" ? (
                                <button
                                  type="button"
                                  className="admin-text-btn admin-text-btn--gold"
                                  disabled={busy}
                                  onClick={() => changeStatus(customer, "active")}
                                >
                                  {t("activateCustomer")}
                                </button>
                              ) : (
                                <button
                                  type="button"
                                  className="admin-text-btn admin-text-btn--danger"
                                  disabled={busy}
                                  onClick={() => changeStatus(customer, "blocked")}
                                >
                                  {t("blockCustomer")}
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td data-label={t("phone")}>{customer.phone || "—"}</td>
                      <td data-label={t("joined")}>{formatDate(customer.createdAt, locale)}</td>
                      <td data-label={t("status")}>
                        <StatusBadge
                          status={customer.status}
                          label={customer.status === "blocked" ? t("blocked") : t("active")}
                        />
                      </td>
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
