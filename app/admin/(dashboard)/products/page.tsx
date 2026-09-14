import ProductsManager from "@/components/admin/ProductsManager";
import { listAllProducts } from "@/lib/db";

export const metadata = { title: "Products" };

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string | string[] }>;
}) {
  const params = await searchParams;
  const raw = params.q;
  const initialQuery = (Array.isArray(raw) ? raw[0] : raw)?.trim() ?? "";
  const products = await listAllProducts();
  return <ProductsManager products={products} initialQuery={initialQuery} />;
}
