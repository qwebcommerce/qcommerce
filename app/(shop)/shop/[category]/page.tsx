import { notFound } from "next/navigation";
import Catalog from "@/components/storefront/Catalog";
import { listCategories, listProducts } from "@/lib/db";
import type { ProductFilters } from "@/types";

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<{ sort?: string }>;
}) {
  const { category } = await params;
  const { sort } = await searchParams;
  const categories = await listCategories();
  const current = categories.find((c) => c.slug === category);
  if (!current && category !== "new-arrivals") notFound();
  const products = await listProducts({
    category,
    sort: (sort as ProductFilters["sort"]) || "newest",
  });
  return (
    <Catalog
      title={(current?.name ?? "New Arrivals").toUpperCase()}
      products={products}
      categories={categories}
      activeSlug={category}
      sort={sort}
    />
  );
}
