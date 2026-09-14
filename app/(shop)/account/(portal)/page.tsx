import AccountView from "@/components/storefront/AccountView";
import { getCustomerSession } from "@/lib/auth";
import { getCustomerById, listOrdersByCustomer } from "@/lib/db";
import { redirect } from "next/navigation";

export const metadata = { title: "Account" };

export default async function AccountPage() {
  const session = await getCustomerSession();
  if (!session) redirect("/account/login");
  const [customer, orders] = await Promise.all([
    getCustomerById(session.id),
    listOrdersByCustomer(session.id, session.email),
  ]);
  return (
    <AccountView
      customer={{
        fullName: customer?.fullName || session.fullName,
        email: customer?.email || session.email,
        phone: customer?.phone ?? "",
      }}
      orders={orders}
    />
  );
}
