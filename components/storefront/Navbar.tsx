"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type CSSProperties, type ReactNode } from "react";
import BrandLogo from "@/components/BrandLogo";
import TopBar from "@/components/TopBar";
import AccountMenu, { type StoreCustomer } from "@/components/storefront/AccountMenu";
import { logoutCustomerAction } from "@/lib/actions";
import { usePreferences } from "@/lib/preferences";
import { useCart, useUi, useWishlist } from "@/lib/store";
import { theme } from "@/theme.config";
import type { MessageKey } from "@/lib/i18n";

export default function Navbar({ customer = null }: { customer?: StoreCustomer | null }) {
  const pathname = usePathname();
  const { count } = useCart();
  const { ids: wishlistIds } = useWishlist();
  const { setSearchOpen, setCartOpen } = useUi();
  const { t } = usePreferences();
  const [scrolled, setScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const isHome = pathname === "/";
  const solid = !isHome || scrolled;
  const textColor = solid ? "var(--black)" : "#fff";
  const allLinks = [
    ...theme.nav.left.map((link) => ({ ...link, sale: false })),
    ...theme.nav.right,
  ];

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <header
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          transition: "background 0.4s ease, backdrop-filter 0.4s ease, box-shadow 0.4s ease",
          backgroundColor: solid ? "var(--nav-solid)" : "transparent",
          backdropFilter: solid ? "blur(12px)" : "none",
          boxShadow: solid ? "0 1px 0 var(--sand)" : "none",
        }}
      >
        <TopBar />

        <nav
          style={{
            maxWidth: "1400px",
            margin: "0 auto",
            padding: "0 2rem",
            height: "68px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ flex: 1, display: "flex", gap: "2.2rem" }} className="hidden md:flex">
            {theme.nav.left.map((link) => (
              <Link key={link.key} href={link.href} className="nav-link" style={{ color: textColor }}>
                {t(link.key as MessageKey)}
              </Link>
            ))}
          </div>

          <Link
            href="/"
            aria-label={theme.brand.name}
            style={{
              flex: 1,
              display: "flex",
              justifyContent: "center",
              textDecoration: "none",
            }}
          >
            <BrandLogo size="nav" />
          </Link>

          <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "1.8rem" }}>
            <div style={{ display: "flex", gap: "2.2rem" }} className="hidden md:flex">
              {theme.nav.right.map((link) => (
                <Link
                  key={link.key}
                  href={link.href}
                  className="nav-link"
                  style={{ color: link.sale ? "var(--sale)" : textColor }}
                >
                  {t(link.key as MessageKey)}
                </Link>
              ))}
            </div>

            <div style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
              <NavIcon title={t("search")} color={textColor} onClick={() => setSearchOpen(true)}>
                <SearchIcon />
              </NavIcon>
              <NavIcon href="/wishlist" title={t("wishlist")} badge={wishlistIds.length || undefined} color={textColor}>
                <HeartIcon />
              </NavIcon>
              <NavIcon title={t("bag")} badge={count} color={textColor} onClick={() => setCartOpen(true)}>
                <BagIcon />
              </NavIcon>
              <button
                onClick={() => setMobileOpen((v) => !v)}
                className="md:hidden"
                style={{ background: "none", border: "none", cursor: "pointer", color: textColor, padding: "4px" }}
                aria-label={t("menu")}
              >
                <svg width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
                  {mobileOpen ? (
                    <>
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </>
                  ) : (
                    <>
                      <line x1="3" y1="6" x2="21" y2="6" />
                      <line x1="3" y1="12" x2="21" y2="12" />
                      <line x1="3" y1="18" x2="21" y2="18" />
                    </>
                  )}
                </svg>
              </button>
              <AccountMenu customer={customer} color={textColor} />
            </div>
          </div>
        </nav>
      </header>

      {mobileOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 999,
            backgroundColor: "var(--warm-white)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: "2.5rem",
          }}
        >
          {allLinks.map((link) => (
            <Link
              key={link.key}
              href={link.href}
              onClick={() => setMobileOpen(false)}
              style={{
                color: "var(--black)",
                fontSize: "2rem",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textDecoration: "none",
                textTransform: "uppercase",
              }}
            >
              {t(link.key as MessageKey)}
            </Link>
          ))}
          {customer ? (
            <>
              <Link
                href="/account"
                onClick={() => setMobileOpen(false)}
                style={{
                  color: "var(--gold-dark)",
                  fontSize: "1.35rem",
                  fontWeight: 800,
                  letterSpacing: "0.12em",
                  textDecoration: "none",
                  textTransform: "uppercase",
                }}
              >
                {t("dashboard")}
              </Link>
              <form action={logoutCustomerAction}>
                <button
                  type="submit"
                  style={{
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    color: "var(--black)",
                    fontSize: "1.35rem",
                    fontWeight: 800,
                    letterSpacing: "0.12em",
                    textTransform: "uppercase",
                    fontFamily: "inherit",
                  }}
                >
                  {t("logOut")}
                </button>
              </form>
            </>
          ) : (
            <Link
              href="/account/login"
              onClick={() => setMobileOpen(false)}
              style={{
                color: "var(--gold-dark)",
                fontSize: "1.35rem",
                fontWeight: 800,
                letterSpacing: "0.12em",
                textDecoration: "none",
                textTransform: "uppercase",
              }}
            >
              {t("account")}
            </Link>
          )}
        </div>
      )}
    </>
  );
}

function NavIcon({
  children,
  title,
  badge,
  color,
  href,
  onClick,
}: {
  children: ReactNode;
  title: string;
  badge?: number;
  color: string;
  href?: string;
  onClick?: () => void;
}) {
  const style: CSSProperties = {
    background: "none",
    border: "none",
    cursor: "pointer",
    color,
    padding: "4px",
    position: "relative",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  };
  const body = (
    <>
      {children}
      {badge !== undefined && badge > 0 ? (
        <span
          style={{
            position: "absolute",
            top: "-2px",
            insetInlineEnd: "-2px",
            backgroundColor: "var(--gold)",
            color: "var(--accent-ink)",
            fontSize: "0.5rem",
            fontWeight: 800,
            minWidth: "14px",
            height: "14px",
            padding: "0 3px",
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {badge > 9 ? "9+" : badge}
        </span>
      ) : null}
    </>
  );
  if (href) {
    return (
      <Link href={href} title={title} aria-label={title} style={style}>
        {body}
      </Link>
    );
  }
  return (
    <button type="button" title={title} aria-label={title} onClick={onClick} style={style}>
      {body}
    </button>
  );
}

function SearchIcon() {
  return (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function HeartIcon() {
  return (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
      <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
    </svg>
  );
}

function BagIcon() {
  return (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
      <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
      <line x1="3" y1="6" x2="21" y2="6" />
      <path d="M16 10a4 4 0 0 1-8 0" />
    </svg>
  );
}

