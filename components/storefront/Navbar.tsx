"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import BrandLogo from "@/components/BrandLogo";
import TopBar from "@/components/TopBar";
import AccountMenu, { type StoreCustomer } from "@/components/storefront/AccountMenu";
import AccountTabs from "@/components/storefront/AccountTabs";
import CollectionsMenu, { CollectionsPanel } from "@/components/storefront/CollectionsMenu";
import { usePreferences } from "@/lib/preferences";
import { useCart, useUi, useWishlist } from "@/lib/store";
import { theme } from "@/theme.config";
import type { Category } from "@/types";

export default function Navbar({
  customer = null,
  categories = [],
}: {
  customer?: StoreCustomer | null;
  categories?: Category[];
}) {
  const pathname = usePathname();
  const { count } = useCart();
  const { ids: wishlistIds } = useWishlist();
  const { setSearchOpen, setCartOpen } = useUi();
  const { t } = usePreferences();
  const [scrolled, setScrolled] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const closeTimer = useRef<number | null>(null);
  const isHome = pathname === "/";
  const isAuthPage = pathname.startsWith("/account/login") || pathname.startsWith("/account/register");
  const showAccountTabs = Boolean(customer) && !isAuthPage;
  const solid = !isHome || scrolled || collectionsOpen;
  const textColor = solid ? "var(--black)" : "#fff";

  function clearCloseTimer() {
    if (closeTimer.current) {
      window.clearTimeout(closeTimer.current);
      closeTimer.current = null;
    }
  }

  function openCollections() {
    clearCloseTimer();
    setCollectionsOpen(true);
  }

  function closeCollections() {
    clearCloseTimer();
    setCollectionsOpen(false);
  }

  function scheduleClose() {
    clearCloseTimer();
    closeTimer.current = window.setTimeout(() => setCollectionsOpen(false), 160);
  }

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!collectionsOpen) return;
    const onPointer = (event: PointerEvent) => {
      const target = event.target as HTMLElement | null;
      if (target?.closest(".shop-nav-shell, .nav-mega-trigger")) return;
      closeCollections();
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") closeCollections();
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [collectionsOpen]);

  useEffect(() => () => clearCloseTimer(), []);

  useEffect(() => {
    if (!collectionsOpen) return;
    const prev = document.body.style.overflow;
    if (window.matchMedia("(max-width: 760px)").matches) document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [collectionsOpen]);

  return (
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

      <div
        className="shop-nav-shell"
        onMouseLeave={() => {
          if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) scheduleClose();
        }}
      >
        <nav className="shop-nav">
          <div className="shop-nav-left">
            <CollectionsMenu
              color={textColor}
              open={collectionsOpen}
              onOpen={() => {
                if (window.matchMedia("(hover: hover) and (pointer: fine)").matches) openCollections();
              }}
              onClose={closeCollections}
              onToggle={() => (collectionsOpen ? closeCollections() : openCollections())}
            />
            <Link href="/shop" className="nav-link shop-nav-store" style={{ color: textColor }}>
              {t("store")}
            </Link>
          </div>

          <Link href="/" aria-label={theme.brand.name} className="shop-nav-logo">
            <BrandLogo size="nav" />
          </Link>

          <div className="shop-nav-right">
            <NavIcon title={t("search")} color={textColor} onClick={() => setSearchOpen(true)}>
              <SearchIcon />
            </NavIcon>
            <NavIcon href="/wishlist" title={t("wishlist")} badge={wishlistIds.length || undefined} color={textColor}>
              <HeartIcon />
            </NavIcon>
            <NavIcon title={t("bag")} badge={count} color={textColor} onClick={() => setCartOpen(true)}>
              <BagIcon />
            </NavIcon>
            <AccountMenu customer={customer} color={textColor} />
          </div>
        </nav>
        <CollectionsPanel
          categories={categories}
          open={collectionsOpen}
          onOpen={openCollections}
          onClose={closeCollections}
        />
      </div>
      {showAccountTabs ? <AccountTabs color={textColor} /> : null}
    </header>
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
