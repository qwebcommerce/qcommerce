"use client";

import Link from "next/link";
import Footer from "@/components/storefront/Footer";
import Navbar from "@/components/storefront/Navbar";
import { usePreferences } from "@/lib/preferences";
import { StoreProviders } from "@/lib/store";

export default function NotFound() {
  const { t } = usePreferences();
  return (
    <StoreProviders>
      <Navbar />
      <main className="flex-1">
        <section className="page-section" style={{ textAlign: "center" }}>
          <h1 className="section-title">{t("pageNotFound")}</h1>
          <p style={{ color: "var(--muted)", margin: "1.5rem 0 2rem" }}>{t("pageNotFoundSub")}</p>
          <Link href="/" className="btn-gold">{t("backHome")}</Link>
        </section>
      </main>
      <Footer />
    </StoreProviders>
  );
}
