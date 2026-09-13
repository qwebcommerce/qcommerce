import SearchResults from "@/components/storefront/SearchResults";
import { listProducts } from "@/lib/db";

export const metadata = { title: "Search" };

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q = "" } = await searchParams;
  const products = q ? await listProducts({ q }) : [];
  return <SearchResults q={q} products={products} />;
}
