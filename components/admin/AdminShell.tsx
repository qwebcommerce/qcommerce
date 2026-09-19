"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import BrandLogo from "@/components/BrandLogo";
import TopBar from "@/components/TopBar";
import { logoutAdminAction } from "@/lib/actions";
import { DROPSHIP_UI_ENABLED } from "@/lib/dropship";
import { usePreferences } from "@/lib/preferences";

const NAV = [
  { href: "/admin", key: "dashboard" as const, icon: DashboardIcon },
  { href: "/admin/products", key: "productsNav" as const, icon: ProductsIcon },
  ...(DROPSHIP_UI_ENABLED ? [{ href: "/admin/dropship", key: "dropshipNav" as const, icon: DropshipIcon }] : []),
  { href: "/admin/orders", key: "ordersNav" as const, icon: OrdersIcon },
  { href: "/admin/expenses", key: "expensesNav" as const, icon: ExpensesIcon },
  { href: "/admin/customers", key: "customersNav" as const, icon: CustomersIcon },
  { href: "/admin/categories", key: "categoriesNav" as const, icon: CategoriesIcon },
  { href: "/admin/settings", key: "settingsNav" as const, icon: SettingsIcon },
];

function isActive(href: string, pathname: string) {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AdminShell({
  children,
  email,
}: {
  children: React.ReactNode;
  email?: string | null;
}) {
  const { t } = usePreferences();
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [isCompact, setIsCompact] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(max-width: 860px)");
    const sync = () => setIsCompact(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!menuOpen) return;
    const previous = document.body.style.overflow;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setMenuOpen(false);
    };
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  return (
    <div className={`admin-shell${menuOpen ? " is-menu-open" : ""}`}>
      <div className="admin-frame">
        <aside
          id="admin-drawer"
          className={`admin-sidebar${menuOpen ? " is-open" : ""}`}
          aria-hidden={isCompact && !menuOpen}
          inert={isCompact && !menuOpen ? true : undefined}
        >
          <div className="admin-sidebar__head">
            <Link href="/admin" className="admin-brand" onClick={() => setMenuOpen(false)}>
              <BrandLogo size="admin" />
            </Link>
            <div className="admin-identity">
              <span className="admin-identity__avatar" aria-hidden="true">
                {(email || t("admin")).trim().charAt(0).toUpperCase()}
              </span>
              <div className="admin-identity__meta">
                <strong>{t("administrator")}</strong>
                <span>{email || t("admin")}</span>
              </div>
            </div>
            <button type="button" className="admin-drawer-close" onClick={() => setMenuOpen(false)}>
              <CloseIcon />
              <span>{t("close")}</span>
            </button>
          </div>
          <nav className="admin-nav">
            {NAV.map((item) => {
              const Icon = item.icon;
              const active = isActive(item.href, pathname);
              return (
                <Link key={item.href} href={item.href} className={`admin-nav-link${active ? " is-active" : ""}`}>
                  <Icon />
                  <span>{t(item.key)}</span>
                </Link>
              );
            })}
          </nav>
          <div className="admin-side-actions">
            <Link href="/" className="admin-side-store">
              {t("viewStore")}
            </Link>
            <form action={logoutAdminAction}>
              <button type="submit" className="admin-side-logout">
                {t("logOut")}
              </button>
            </form>
          </div>
        </aside>
        <div className="admin-content">
          <TopBar compact adminEmail={email} />
          <div className="admin-mobile-bar">
            <Link href="/admin" className="admin-mobile-brand">
              <BrandLogo size="admin" />
              <small>{t("admin")}</small>
            </Link>
            <button
              type="button"
              className="admin-menu-btn"
              aria-expanded={menuOpen}
              aria-controls="admin-drawer"
              onClick={() => setMenuOpen(true)}
            >
              <MenuIcon />
              <span>{t("menu")}</span>
            </button>
          </div>
          <div className="admin-main">{children}</div>
        </div>
      </div>
    </div>
  );
}

function MenuIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function DashboardIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="3.5" width="7" height="4.5" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="10.5" width="7" height="10" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
      <rect x="3.5" y="13" width="7" height="7.5" rx="1.6" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ProductsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M4.5 8.2 12 4.5l7.5 3.7v7.6L12 19.5 4.5 15.8V8.2Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <path d="M12 19.5V12M4.5 8.2 12 12l7.5-3.8" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function DropshipIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M3.5 7.5h11v9.5H3.5V7.5Z" stroke="currentColor" strokeWidth="1.6" />
      <path d="M14.5 10.5h4.2L21 13.2v3.8h-6.5" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
      <circle cx="7" cy="18.2" r="1.4" stroke="currentColor" strokeWidth="1.6" />
      <circle cx="17.2" cy="18.2" r="1.4" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7h10M7 12h10M7 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="4" y="3.5" width="16" height="17" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ExpensesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4.5" y="3.5" width="15" height="17" rx="2" stroke="currentColor" strokeWidth="1.6" />
      <path d="M8 8h8M8 12h8M8 16h5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CustomersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="9" cy="8" r="2.6" stroke="currentColor" strokeWidth="1.6" />
      <path d="M4.6 18c.5-2.8 2.3-4.3 4.4-4.3s3.9 1.5 4.4 4.3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <circle cx="16.4" cy="9" r="2.1" stroke="currentColor" strokeWidth="1.6" />
      <path d="M19.4 18c-.3-2-1.5-3.2-3-3.2" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}

function CategoriesIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="4" y="4" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="4" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="4" y="13.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
      <rect x="13.5" y="13.5" width="6.5" height="6.5" rx="1.5" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function SettingsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="12" r="3.1" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M19.4 12.8a7.7 7.7 0 0 0 .06-1.6l1.7-1.3-1.6-2.8-2 .8a7.8 7.8 0 0 0-1.4-.8l-.3-2.2h-3.2l-.3 2.2c-.5.2-1 .5-1.4.8l-2-.8-1.6 2.8 1.7 1.3a7.7 7.7 0 0 0-.06 1.6l-1.7 1.3 1.6 2.8 2-.8c.4.3.9.6 1.4.8l.3 2.2h3.2l.3-2.2c.5-.2 1-.5 1.4-.8l2 .8 1.6-2.8-1.7-1.3Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  );
}

