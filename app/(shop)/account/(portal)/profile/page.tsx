import { AccountProfileView } from "@/components/storefront/AccountView";
import { getCustomerSession } from "@/lib/auth";
import { getCustomerById } from "@/lib/db";
import { redirect } from "next/navigation";

export const metadata = { title: "Profile" };

export default async function AccountProfilePage() {
  const session = await getCustomerSession();
  if (!session) redirect("/account/login");
  const customer = await getCustomerById(session.id);
  return (
    <AccountProfileView
      customer={{
        fullName: customer?.fullName || session.fullName,
        email: customer?.email || session.email,
        phone: customer?.phone ?? "",
      }}
    />
  );
}
