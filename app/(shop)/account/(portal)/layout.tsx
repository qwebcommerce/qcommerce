import { redirect } from "next/navigation";
import AccountShell from "@/components/storefront/AccountShell";
import { getCustomerSession } from "@/lib/auth";
import { getCustomerById } from "@/lib/db";

export default async function AccountPortalLayout({ children }: { children: React.ReactNode }) {
  const session = await getCustomerSession();
  if (!session) redirect("/account/login");
  const customer = await getCustomerById(session.id);
  return (
    <AccountShell
      customer={{
        fullName: customer?.fullName || session.fullName,
        email: customer?.email || session.email,
      }}
    >
      {children}
    </AccountShell>
  );
}
