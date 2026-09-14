import AdminShell from "@/components/admin/AdminShell";
import { getAdminSession } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const email = await getAdminSession();
  return <AdminShell email={email}>{children}</AdminShell>;
}
