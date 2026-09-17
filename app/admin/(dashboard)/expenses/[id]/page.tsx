import { notFound } from "next/navigation";
import ExpenseForm from "@/components/admin/ExpenseForm";
import { getExpenseById } from "@/lib/db";

export const metadata = { title: "Edit expense" };

export default async function EditExpensePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const expense = await getExpenseById(id);
  if (!expense) notFound();
  return <ExpenseForm expense={expense} />;
}
