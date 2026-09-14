import CartDrawer from "@/components/storefront/CartDrawer";
import Footer from "@/components/storefront/Footer";
import Navbar from "@/components/storefront/Navbar";
import SearchModal from "@/components/storefront/SearchModal";
import { getCustomerSession } from "@/lib/auth";
import { CommerceSettingsProvider } from "@/lib/commerce-settings";
import { getStoreSettings } from "@/lib/db";
import { StoreProviders } from "@/lib/store";

export const dynamic = "force-dynamic";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const [settings, session] = await Promise.all([getStoreSettings(), getCustomerSession()]);
  return (
    <StoreProviders>
      <CommerceSettingsProvider settings={settings}>
        <Navbar
          customer={session ? { fullName: session.fullName, email: session.email } : null}
        />
        <main className="flex-1">{children}</main>
        <Footer />
        <CartDrawer />
        <SearchModal />
      </CommerceSettingsProvider>
    </StoreProviders>
  );
}
