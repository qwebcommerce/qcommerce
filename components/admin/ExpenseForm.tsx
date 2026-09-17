"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminSelect from "@/components/admin/AdminSelect";
import ExpenseFilesField, { type DraftExpenseFile } from "@/components/admin/ExpenseFilesField";
import { saveExpenseAction } from "@/lib/actions";
import {
  EXPENSE_CATEGORIES,
  EXPENSE_SUBCATEGORIES,
  expenseCategoryKey,
  expenseSubcategoryKey,
  isExpenseCategory,
  todayIsoDate,
} from "@/lib/expenses";
import { usePreferences } from "@/lib/preferences";
import { useToast } from "@/lib/toast";
import type { Expense, ExpenseCategory } from "@/types";

export default function ExpenseForm({ expense }: { expense?: Expense }) {
  const { t } = usePreferences();
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [amount, setAmount] = useState(expense ? String(expense.amount) : "");
  const [incurredOn, setIncurredOn] = useState(expense?.incurredOn ?? todayIsoDate());
  const [category, setCategory] = useState<ExpenseCategory>(expense?.category ?? "shop");
  const [subcategory, setSubcategory] = useState(
    expense?.subcategory && EXPENSE_SUBCATEGORIES[expense.category].includes(expense.subcategory)
      ? expense.subcategory
      : EXPENSE_SUBCATEGORIES[expense?.category ?? "shop"][0],
  );
  const [notes, setNotes] = useState(expense?.notes ?? "");
  const [files, setFiles] = useState<DraftExpenseFile[]>(expense?.files ?? []);

  function changeCategory(next: string) {
    if (!isExpenseCategory(next)) return;
    setCategory(next);
    const subs = EXPENSE_SUBCATEGORIES[next];
    setSubcategory(subs.includes(subcategory) ? subcategory : subs[0]);
  }

  function save(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    formData.set("category", category);
    formData.set("subcategory", subcategory);
    formData.set(
      "files",
      JSON.stringify(
        files.map(({ id, path, name, size, type }) => ({ id, path, name, size, type })),
      ),
    );
    startTransition(async () => {
      const result = await saveExpenseAction(formData);
      if (result?.error) {
        setError(result.error);
        toast.error(t("toastError"), result.error);
        return;
      }
      toast.success(expense ? t("toastExpenseUpdated") : t("toastExpenseCreated"));
      router.push("/admin/expenses");
      router.refresh();
    });
  }

  return (
    <div className="admin-form-page">
      <Link href="/admin/expenses" className="admin-back">
        ← {t("backToExpenses")}
      </Link>
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">{t("admin")}</p>
          <h1 className="admin-title">{expense ? t("editExpense") : t("newExpense")}</h1>
        </div>
      </div>
      <form onSubmit={save} className="admin-form-card">
        {expense ? <input type="hidden" name="id" value={expense.id} /> : null}
        {error ? <p className="admin-form-error">{error}</p> : null}
        <div className="admin-form-grid">
          <label>
            <span className="admin-label">{t("expenseAmount")}</span>
            <input
              name="amount"
              required
              className="admin-input"
              inputMode="decimal"
              value={amount}
              onFocus={(event) => event.currentTarget.select()}
              onChange={(event) => {
                const raw = event.target.value.trim();
                if (raw === "" || /^\d+(\.\d{0,2})?$/.test(raw)) setAmount(raw);
              }}
            />
          </label>
          <label>
            <span className="admin-label">{t("expenseDate")}</span>
            <input
              name="incurredOn"
              type="date"
              required
              className="admin-input"
              value={incurredOn}
              onChange={(event) => setIncurredOn(event.target.value)}
            />
          </label>
        </div>
        <div className="admin-form-grid">
          <label>
            <span className="admin-label">{t("expenseCategory")}</span>
            <AdminSelect
              value={category}
              aria-label={t("expenseCategory")}
              options={EXPENSE_CATEGORIES.map((item) => ({ value: item, label: t(expenseCategoryKey(item)) }))}
              onChange={changeCategory}
            />
          </label>
          <label>
            <span className="admin-label">{t("expenseSubcategory")}</span>
            <AdminSelect
              value={subcategory}
              aria-label={t("expenseSubcategory")}
              options={EXPENSE_SUBCATEGORIES[category].map((item) => ({
                value: item,
                label: t(expenseSubcategoryKey(item)),
              }))}
              onChange={setSubcategory}
            />
          </label>
        </div>
        <label>
          <span className="admin-label">{t("expenseNotes")}</span>
          <textarea
            name="notes"
            className="admin-textarea"
            rows={4}
            value={notes}
            onChange={(event) => setNotes(event.target.value)}
          />
        </label>
        <ExpenseFilesField expenseId={expense?.id} files={files} onChange={setFiles} />
        <div className="admin-form-actions">
          <Link href="/admin/expenses" className="admin-text-btn">
            {t("cancel")}
          </Link>
          <button className="btn-gold btn-compact" disabled={pending} type="submit">
            {pending ? t("saving") : expense ? t("saveExpense") : t("createExpense")}
          </button>
        </div>
      </form>
    </div>
  );
}
