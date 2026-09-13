import ProductForm from "@/components/admin/ProductForm";
import { listCategories } from "@/lib/db";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await listCategories();
  return (
    <div>
      <h1 style={{ fontSize: "1.6rem", fontWeight: 900, marginBottom: "1.5rem" }}>NEW PRODUCT</h1>
      <ProductForm categories={categories} />
    </div>
  );
}
