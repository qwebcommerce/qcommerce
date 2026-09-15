import { redirect } from "next/navigation";
import AccountShell from "@/components/storefront/AccountShell";
import { clearCustomerSession, getCustomerSession } from "@/lib/auth";
import { getCustomerById } from "@/lib/db";

export default async function AccountPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getCustomerSession();
  if (!session) redirect("/account/login");
  const customer = await getCustomerById(session.id);
  if (!customer || customer.status === "blocked") {
    await clearCustomerSession();
    redirect("/account/login");
  }
  return <AccountShell>{children}</AccountShell>;
}
