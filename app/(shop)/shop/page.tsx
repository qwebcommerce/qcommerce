import Catalog from "@/components/storefront/Catalog";
import { listCategories, listProducts } from "@/lib/db";
import type { ProductFilters } from "@/types";

export const metadata = { title: "Shop" };

export default async function ShopPage({
  searchParams,
}: {
  searchParams: Promise<{ sort?: string; q?: string }>;
}) {
  const { sort, q } = await searchParams;
  const filters: ProductFilters = {
    sort: (sort as ProductFilters["sort"]) || "newest",
    q,
  };
  const [products, categories] = await Promise.all([listProducts(filters), listCategories()]);
  return <Catalog title="ALL PRODUCTS" products={products} categories={categories} sort={filters.sort} />;
}
