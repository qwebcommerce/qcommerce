"use client";

import Link from "next/link";
import TopBar from "@/components/TopBar";
import { logoutAdminAction } from "@/lib/actions";
import { usePreferences } from "@/lib/preferences";
import { theme } from "@/theme.config";

const NAV = [
  { href: "/admin", key: "dashboard" as const },
  { href: "/admin/products", key: "productsNav" as const },
  { href: "/admin/orders", key: "ordersNav" as const },
  { href: "/admin/customers", key: "customersNav" as const },
  { href: "/admin/categories", key: "categoriesNav" as const },
];

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const { t } = usePreferences();
  return (
    <div style={{ minHeight: "100vh", background: "var(--off-white)" }}>
      <TopBar compact />
      <div style={{ display: "grid", gridTemplateColumns: "240px 1fr" }} className="max-md:grid-cols-1">
        <aside style={{ background: "var(--black)", color: "var(--warm-white)", padding: "2rem 1.25rem", display: "flex", flexDirection: "column", minHeight: "calc(100vh - 36px)" }}>
          <Link href="/admin" style={{ color: "var(--warm-white)", fontWeight: 900, letterSpacing: "0.22em", textDecoration: "none", marginBottom: "2.5rem" }}>
            <span dir="ltr">{theme.brand.name}</span>
          </Link>
          <nav style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
            {NAV.map((item) => (
              <Link key={item.href} href={item.href} style={{ color: "rgba(255,255,255,0.72)", textDecoration: "none", fontSize: "0.78rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: "0.7rem 0.6rem" }}>
                {t(item.key)}
              </Link>
            ))}
          </nav>
          <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <Link href="/" style={{ color: "var(--gold)", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", textDecoration: "none" }}>
              {t("viewStore")}
            </Link>
            <form action={logoutAdminAction}>
              <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.45)", cursor: "pointer", fontSize: "0.72rem", letterSpacing: "0.12em", textTransform: "uppercase", padding: 0 }}>
                {t("logOut")}
              </button>
            </form>
          </div>
        </aside>
        <div style={{ padding: "2rem", minWidth: 0 }}>{children}</div>
      </div>
    </div>
  );
}
