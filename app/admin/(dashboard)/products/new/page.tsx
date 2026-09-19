import ProductForm from "@/components/admin/ProductForm";
import { getStoreSettings, listCategories } from "@/lib/db";

export const metadata = { title: "New product" };

export default async function NewProductPage() {
  const [categories, settings] = await Promise.all([listCategories(), getStoreSettings()]);
  return <ProductForm categories={categories} dropshipBuffer={settings.dropshipBuffer} />;
}
