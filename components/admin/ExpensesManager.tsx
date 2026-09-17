"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminModal from "@/components/admin/AdminModal";
import AdminSelect from "@/components/admin/AdminSelect";
import { deleteExpenseAction } from "@/lib/actions";
import {
  EXPENSE_CATEGORIES,
  expenseCategoryKey,
  expenseFileDownloadPath,
  expenseSubcategoryKey,
  formatExpenseDate,
  formatFileSize,
} from "@/lib/expenses";
import { formatQar } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { useToast } from "@/lib/toast";
import type { Expense } from "@/types";

const PAGE_SIZE = 8;

export default function ExpensesManager({ expenses }: { expenses: Expense[] }) {
  const { t, locale } = usePreferences();
  const toast = useToast();
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<Expense | null>(null);
  const [error, setError] = useState("");

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase();
    return expenses.filter((expense) => {
      if (categoryFilter !== "all" && expense.category !== categoryFilter) return false;
      if (!needle) return true;
      const haystack = [
        formatQar(expense.amount),
        String(expense.amount),
        t(expenseCategoryKey(expense.category)),
        t(expenseSubcategoryKey(expense.subcategory)),
        expense.notes,
        expense.files.map((file) => file.name).join(" "),
      ]
        .join(" ")
        .toLowerCase();
      return haystack.includes(needle);
    });
  }, [expenses, query, categoryFilter, t]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  useEffect(() => {
    setPage(1);
  }, [query, categoryFilter]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function confirmDelete() {
    if (!deleting) return;
    const form = new FormData();
    form.set("id", deleting.id);
    startTransition(async () => {
      const result = await deleteExpenseAction(form);
      if (result.error) {
        setError(result.error);
        toast.error(t("toastError"), result.error);
        return;
      }
      toast.success(t("toastExpenseDeleted"));
      setDeleting(null);
      setError("");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">{t("admin")}</p>
          <h1 className="admin-title">{t("expensesNav")}</h1>
        </div>
        <div className="admin-page-head__actions">
          <Link href="/admin/expenses/new" className="btn-gold btn-compact">
            {t("addExpense")}
          </Link>
        </div>
      </div>
      <p className="admin-lead">{t("expensesIntro")}</p>

      {expenses.length > 0 ? (
        <div className="admin-toolbar">
          <label className="admin-search">
            <SearchIcon />
            <span className="sr-only">{t("expenseSearch")}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("expenseSearch")}
            />
          </label>
          <AdminSelect
            value={categoryFilter}
            aria-label={t("expenseCategory")}
            options={[
              { value: "all", label: t("allCategories") },
              ...EXPENSE_CATEGORIES.map((item) => ({ value: item, label: t(expenseCategoryKey(item)) })),
            ]}
            onChange={setCategoryFilter}
          />
        </div>
      ) : null}

      {expenses.length === 0 ? (
        <section className="admin-panel">
          <p className="admin-empty">{t("noExpensesAdmin")}</p>
        </section>
      ) : filtered.length === 0 ? (
        <section className="admin-panel">
          <p className="admin-empty">{t("noExpensesMatch")}</p>
        </section>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("dateCol")}</th>
                  <th>{t("expenseCategory")}</th>
                  <th>{t("expenseAmount")}</th>
                  <th>{t("expenseNotes")}</th>
                  <th>{t("expenseFiles")}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((expense) => (
                  <tr key={expense.id}>
                    <td data-label={t("dateCol")}>
                      <strong className="admin-table__name">{formatExpenseDate(expense.incurredOn, locale)}</strong>
                      <div className="admin-table__actions">
                        <Link href={`/admin/expenses/${expense.id}`} className="admin-text-btn">
                          {t("edit")}
                        </Link>
                        <button
                          type="button"
                          className="admin-text-btn admin-text-btn--danger"
                          onClick={() => {
                            setError("");
                            setDeleting(expense);
                          }}
                        >
                          {t("delete")}
                        </button>
                      </div>
                    </td>
                    <td data-label={t("expenseCategory")}>
                      {t(expenseCategoryKey(expense.category))}
                      <span className="admin-table__muted">{t(expenseSubcategoryKey(expense.subcategory))}</span>
                    </td>
                    <td data-label={t("expenseAmount")}>{formatQar(expense.amount)}</td>
                    <td data-label={t("expenseNotes")}>
                      {expense.notes ? (
                        <span className="admin-expense-notes" title={expense.notes}>
                          {expense.notes}
                        </span>
                      ) : (
                        <span className="admin-table__muted">—</span>
                      )}
                    </td>
                    <td data-label={t("expenseFiles")}>
                      {expense.files.length ? (
                        <div className="admin-file-links">
                          {expense.files.map((file) => (
                            <a
                              key={file.id}
                              href={expenseFileDownloadPath(expense.id, file.id)}
                              className="admin-text-btn"
                              download={file.name}
                              title={`${file.name} · ${formatFileSize(file.size)}`}
                            >
                              {t("expenseDownload")} · {file.name}
                            </a>
                          ))}
                        </div>
                      ) : (
                        <span className="admin-table__muted">{t("expenseNoFiles")}</span>
                      )}
                    </td>
                  </tr>
                ))}
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

      {deleting ? (
        <AdminModal
          title={t("deleteExpenseTitle")}
          onClose={() => (pending ? undefined : setDeleting(null))}
          footer={
            <>
              <button type="button" className="admin-text-btn" onClick={() => setDeleting(null)} disabled={pending}>
                {t("cancel")}
              </button>
              <button type="button" className="btn-gold btn-compact btn-danger" onClick={confirmDelete} disabled={pending}>
                {pending ? t("saving") : t("delete")}
              </button>
            </>
          }
        >
          {error ? <p className="admin-form-error">{error}</p> : null}
          <p className="admin-modal-note">{t("confirmDeleteExpense", { amount: formatQar(deleting.amount) })}</p>
        </AdminModal>
      ) : null}
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
