import CustomersManager from "@/components/admin/CustomersManager";
import { listCustomers } from "@/lib/db";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  const customers = await listCustomers();
  return <CustomersManager customers={customers} />;
}
