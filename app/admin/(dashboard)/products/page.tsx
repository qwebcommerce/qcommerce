import Link from "next/link";
import StatusBadge from "@/components/admin/StatusBadge";
import { deleteProductAction } from "@/lib/actions";
import { listAllProducts } from "@/lib/db";
import { formatQar } from "@/lib/format";

export const metadata = { title: "Products" };

export default async function AdminProductsPage() {
  const products = await listAllProducts();

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "1.5rem" }}>
        <h1 style={{ fontSize: "1.6rem", fontWeight: 900 }}>PRODUCTS</h1>
        <Link href="/admin/products/new" className="btn-gold">Add product</Link>
      </div>
      <div style={{ background: "var(--surface)", border: "1px solid var(--sand)", overflowX: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.88rem" }}>
          <thead>
            <tr style={{ textAlign: "left", borderBottom: "1px solid var(--sand)" }}>
              <th style={{ padding: "0.85rem" }}>Product</th>
              <th>Category</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} style={{ borderBottom: "1px solid var(--off-white)" }}>
                <td style={{ padding: "0.85rem" }}>
                  <Link href={`/admin/products/${product.id}`} style={{ fontWeight: 700, textDecoration: "none", color: "inherit" }}>{product.name}</Link>
                  <div style={{ color: "var(--muted)", fontSize: "0.75rem" }}>{product.sku}</div>
                </td>
                <td>{product.category}</td>
                <td>{formatQar(product.price)}</td>
                <td>{product.stock}</td>
                <td><StatusBadge status={product.status} /></td>
                <td>
                  <form action={deleteProductAction}>
                    <input type="hidden" name="id" value={product.id} />
                    <button style={{ background: "none", border: "none", color: "var(--sale)", cursor: "pointer", fontSize: "0.75rem" }}>Delete</button>
                  </form>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
