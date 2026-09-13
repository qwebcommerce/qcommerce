import CategoryGrid from "@/components/storefront/CategoryGrid";
import FeaturedProducts from "@/components/storefront/FeaturedProducts";
import HeroSlider from "@/components/storefront/HeroSlider";
import InstagramGrid from "@/components/storefront/InstagramGrid";
import LoadingScreen from "@/components/storefront/LoadingScreen";
import MarqueeTicker from "@/components/storefront/MarqueeTicker";
import NewArrivals from "@/components/storefront/NewArrivals";
import Newsletter from "@/components/storefront/Newsletter";
import PressSection from "@/components/storefront/PressSection";
import TrustBadges from "@/components/storefront/TrustBadges";
import { listCategories, listProducts } from "@/lib/db";

export default async function HomePage() {
  const [products, categories] = await Promise.all([listProducts(), listCategories()]);
  const newest = [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 8);

  return (
    <>
      <LoadingScreen />
      <HeroSlider />
      <MarqueeTicker variant="dark" />
      <TrustBadges />
      <NewArrivals products={newest} />
      <MarqueeTicker variant="light" />
      <CategoryGrid categories={categories} />
      <FeaturedProducts products={products} />
      <PressSection />
      <InstagramGrid />
      <Newsletter />
    </>
  );
}
