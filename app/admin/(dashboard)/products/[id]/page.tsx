import { notFound } from "next/navigation";
import ProductForm from "@/components/admin/ProductForm";
import { getProductById, getStoreSettings, listCategories } from "@/lib/db";

export const metadata = { title: "Edit product" };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [product, categories, settings] = await Promise.all([
    getProductById(id),
    listCategories(),
    getStoreSettings(),
  ]);
  if (!product) notFound();
  return <ProductForm product={product} categories={categories} dropshipBuffer={settings.dropshipBuffer} />;
}
