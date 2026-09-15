import { AccountOrdersView } from "@/components/storefront/AccountView";
import { getCustomerSession } from "@/lib/auth";
import { listOrdersByCustomer } from "@/lib/db";
import { redirect } from "next/navigation";

export const metadata = { title: "Orders" };

export default async function AccountOrdersPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/account/login");
  const orders = await listOrdersByCustomer(session.id, session.email);
  return <AccountOrdersView orders={orders} />;
}
