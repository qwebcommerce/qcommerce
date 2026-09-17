import ExpensesManager from "@/components/admin/ExpensesManager";
import { listExpenses } from "@/lib/db";

export const metadata = { title: "Expenses" };

export default async function AdminExpensesPage() {
  const expenses = await listExpenses();
  return <ExpensesManager expenses={expenses} />;
}
