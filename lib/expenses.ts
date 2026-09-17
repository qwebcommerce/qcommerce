import type { MessageKey } from "@/lib/i18n";
import type { ExpenseCategory } from "@/types";

export const MAX_EXPENSE_FILES = 8;
export const MAX_EXPENSE_FILE_BYTES = 10 * 1024 * 1024;

export const EXPENSE_CATEGORIES: ExpenseCategory[] = ["home", "shop", "salary", "marketing"];

export const EXPENSE_SUBCATEGORIES: Record<ExpenseCategory, readonly string[]> = {
  home: ["electricity", "water", "internet", "rent", "bills", "daily-expenses", "others"],
  shop: ["petty-cash", "products", "repairs", "rent", "water", "electricity", "internet", "others"],
  salary: ["salary", "advance", "deduction", "tips", "staff-loans", "others"],
  marketing: ["meta-ads", "google-ads", "owner-withdrawals", "others"],
};

const CATEGORY_KEYS: Record<ExpenseCategory, MessageKey> = {
  home: "expenseCatHome",
  shop: "expenseCatShop",
  salary: "expenseCatSalary",
  marketing: "expenseCatMarketing",
};

const SUBCATEGORY_KEYS: Record<string, MessageKey> = {
  electricity: "expenseSubElectricity",
  water: "expenseSubWater",
  internet: "expenseSubInternet",
  rent: "expenseSubRent",
  bills: "expenseSubBills",
  "daily-expenses": "expenseSubDailyExpenses",
  others: "expenseSubOthers",
  "petty-cash": "expenseSubPettyCash",
  products: "expenseSubProducts",
  repairs: "expenseSubRepairs",
  salary: "expenseSubSalary",
  advance: "expenseSubAdvance",
  deduction: "expenseSubDeduction",
  tips: "expenseSubTips",
  "staff-loans": "expenseSubStaffLoans",
  "meta-ads": "expenseSubMetaAds",
  "google-ads": "expenseSubGoogleAds",
  "owner-withdrawals": "expenseSubOwnerWithdrawals",
};

export function isExpenseCategory(value: string): value is ExpenseCategory {
  return EXPENSE_CATEGORIES.includes(value as ExpenseCategory);
}

export function expenseCategoryKey(category: ExpenseCategory): MessageKey {
  return CATEGORY_KEYS[category];
}

export function expenseSubcategoryKey(subcategory: string): MessageKey {
  return SUBCATEGORY_KEYS[subcategory] ?? "expenseSubOthers";
}

export function isValidExpensePair(category: string, subcategory: string): category is ExpenseCategory {
  return isExpenseCategory(category) && EXPENSE_SUBCATEGORIES[category].includes(subcategory);
}

export function todayIsoDate() {
  const now = new Date();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}-${month}-${day}`;
}

export function formatExpenseDate(isoDate: string, locale = "en") {
  const [year, month, day] = isoDate.slice(0, 10).split("-").map(Number);
  if (!year || !month || !day) return isoDate;
  return new Date(year, month - 1, day).toLocaleDateString(locale === "ar" ? "ar-QA" : "en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(bytes < 10 * 1024 ? 1 : 0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(bytes < 10 * 1024 * 1024 ? 1 : 0)} MB`;
}

export function expenseFileViewPath(expenseId: string, fileId: string) {
  return `/api/admin/expenses/${expenseId}/files/${fileId}`;
}

export function expenseFileDownloadPath(expenseId: string, fileId: string) {
  return `${expenseFileViewPath(expenseId, fileId)}?download=1`;
}

export function isPreviewableExpenseFile(type: string) {
  return type.startsWith("image/") || type === "application/pdf";
}
