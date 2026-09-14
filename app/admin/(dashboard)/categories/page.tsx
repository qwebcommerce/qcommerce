import CategoriesManager from "@/components/admin/CategoriesManager";
import { listAllProducts, listCategories } from "@/lib/db";

export const metadata = { title: "Categories" };

export default async function AdminCategoriesPage() {
  const [categories, products] = await Promise.all([listCategories(), listAllProducts()]);
  const productCounts = products.reduce<Record<string, number>>((acc, product) => {
    acc[product.categorySlug] = (acc[product.categorySlug] ?? 0) + 1;
    return acc;
  }, {});

  return <CategoriesManager categories={categories} productCounts={productCounts} />;
}
