"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { logoutCustomerAction } from "@/lib/actions";
import { usePreferences } from "@/lib/preferences";
import type { MessageKey } from "@/lib/i18n";

const tabs: { href: string; key: MessageKey; match: (pathname: string) => boolean }[] = [
  { href: "/account", key: "dashboard", match: (pathname) => pathname === "/account" },
  { href: "/account/orders", key: "ordersNav", match: (pathname) => pathname.startsWith("/account/orders") },
  { href: "/account/profile", key: "profileNav", match: (pathname) => pathname.startsWith("/account/profile") },
];

export default function AccountTabs({ color }: { color: string }) {
  const pathname = usePathname();
  const { t } = usePreferences();

  return (
    <div className="account-tabs">
      <div className="account-tabs__inner">
        <nav className="account-tabs__nav" aria-label={t("account")}>
          {tabs.map((tab) => {
            const active = tab.match(pathname);
            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`account-tab${active ? " is-active" : ""}`}
                style={active ? undefined : { color }}
                aria-current={active ? "page" : undefined}
              >
                {t(tab.key)}
              </Link>
            );
          })}
          <form action={logoutCustomerAction} className="account-tabs__logout">
            <button type="submit" className="account-tab account-tab--action" style={{ color }}>
              {t("logOut")}
            </button>
          </form>
        </nav>
      </div>
    </div>
  );
}
