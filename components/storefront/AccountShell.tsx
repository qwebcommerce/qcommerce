"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutCustomerAction } from "@/lib/actions";
import { usePreferences } from "@/lib/preferences";
import type { StoreCustomer } from "@/components/storefront/AccountMenu";

function isActive(href: string, pathname: string) {
  if (href === "/account") return pathname === "/account";
  return pathname === href || pathname.startsWith(`${href}/`);
}

export default function AccountShell({
  customer,
  children,
}: {
  customer: StoreCustomer;
  children: React.ReactNode;
}) {
  const { t } = usePreferences();
  const pathname = usePathname();

  return (
    <div className="account-portal">
      <aside className="account-portal__side">
        <div className="admin-identity account-identity">
          <strong>{customer.fullName}</strong>
          <span>{customer.email}</span>
        </div>
        <nav className="admin-nav">
          <Link
            href="/account"
            className={`admin-nav-link${isActive("/account", pathname) && !pathname.startsWith("/account/orders") ? " is-active" : ""}`}
          >
            <DashboardIcon />
            <span>{t("dashboard")}</span>
          </Link>
          <Link
            href="/account#orders"
            className={`admin-nav-link${pathname.startsWith("/account/orders") ? " is-active" : ""}`}
          >
            <OrdersIcon />
            <span>{t("ordersNav")}</span>
          </Link>
          <Link href="/account#profile" className="admin-nav-link">
            <ProfileIcon />
            <span>{t("profileNav")}</span>
          </Link>
        </nav>
        <div className="admin-side-actions">
          <Link href="/shop" className="admin-side-store">
            {t("continueShopping")}
          </Link>
          <form action={logoutCustomerAction}>
            <button type="submit" className="admin-side-logout">
              {t("logOut")}
            </button>
          </form>
        </div>
      </aside>
      <div className="account-portal__main">{children}</div>
    </div>
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

function OrdersIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path d="M7 7h10M7 12h10M7 17h6" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
      <rect x="4" y="3.5" width="16" height="17" rx="2.2" stroke="currentColor" strokeWidth="1.6" />
    </svg>
  );
}

function ProfileIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8" r="3" stroke="currentColor" strokeWidth="1.6" />
      <path d="M5.5 19c.7-3.2 3-5 6.5-5s5.8 1.8 6.5 5" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
