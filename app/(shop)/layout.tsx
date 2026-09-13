import CartDrawer from "@/components/storefront/CartDrawer";
import Footer from "@/components/storefront/Footer";
import Navbar from "@/components/storefront/Navbar";
import SearchModal from "@/components/storefront/SearchModal";
import { StoreProviders } from "@/lib/store";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <StoreProviders>
      <Navbar />
      <main className="flex-1">{children}</main>
      <Footer />
      <CartDrawer />
      <SearchModal />
    </StoreProviders>
  );
}
