import Link from "next/link";
import { listCustomers } from "@/lib/db";
import { formatDate } from "@/lib/format";

export const metadata = { title: "Customers" };

export default async function AdminCustomersPage() {
  const customers = await listCustomers();

  return (
    <div>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 900, marginBottom: "1.5rem" }}>CUSTOMERS</h1>
      <div style={{ background: "var(--surface)", border: "1px solid var(--sand)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--sand)" }}>
              <th style={{ padding: "0.85rem" }}>Name</th>
              <th>Email</th>
              <th>Phone</th>
              <th>Joined</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} style={{ borderBottom: "1px solid var(--off-white)" }}>
                <td style={{ padding: "0.85rem" }}>
                  <Link href={`/admin/customers/${customer.id}`} style={{ fontWeight: 700, color: "inherit" }}>{customer.fullName}</Link>
                </td>
                <td>{customer.email}</td>
                <td>{customer.phone || "—"}</td>
                <td>{formatDate(customer.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
