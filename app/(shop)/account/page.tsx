import { redirect } from "next/navigation";
import AccountView from "@/components/storefront/AccountView";
import { getCustomerSession } from "@/lib/auth";
import { listOrdersByCustomer } from "@/lib/db";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/account/login");
  const orders = await listOrdersByCustomer(session.id, session.email);
  return <AccountView name={session.fullName} orders={orders} />;
}
