import { notFound } from "next/navigation";
import ProductDetail from "@/components/storefront/ProductDetail";
import { getProductBySlug, listProducts } from "@/lib/db";

export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  const related = (await listProducts({ category: product.categorySlug })).filter((p) => p.id !== product.id).slice(0, 4);
  return <ProductDetail product={product} related={related} />;
}
