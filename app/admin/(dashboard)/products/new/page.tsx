import ProductForm from "@/components/admin/ProductForm";
import { listCategories } from "@/lib/db";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const categories = await listCategories();
  return <ProductForm categories={categories} />;
}
