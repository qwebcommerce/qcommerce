"use client";

import Link from "next/link";
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";
import { logoutCustomerAction } from "@/lib/actions";
import { usePreferences } from "@/lib/preferences";

export type StoreCustomer = {
  fullName: string;
  email: string;
};

function initials(name: string, email: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) {
    return `${parts[0][0] ?? ""}${parts[1][0] ?? ""}`.toUpperCase();
  }
  const letter = parts[0]?.[0] || email.trim()[0] || "U";
  return letter.toUpperCase();
}

export default function AccountMenu({
  customer,
  color,
}: {
  customer: StoreCustomer | null;
  color: string;
}) {
  const { t } = usePreferences();
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!root.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!customer) {
    return (
      <NavIcon href="/account/login" title={t("account")} color={color}>
        <UserIcon />
      </NavIcon>
    );
  }

  return (
    <div className="admin-avatar nav-avatar" ref={root}>
      <button
        type="button"
        className="admin-avatar__btn"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((value) => !value)}
        title={customer.fullName || customer.email}
      >
        {initials(customer.fullName, customer.email)}
      </button>
      {open ? (
        <div className="admin-avatar__menu" role="menu">
          <p className="admin-avatar__email">{customer.email}</p>
          <Link href="/account" role="menuitem" onClick={() => setOpen(false)}>
            {t("dashboard")}
          </Link>
          <Link href="/account/orders" role="menuitem" onClick={() => setOpen(false)}>
            {t("ordersNav")}
          </Link>
          <Link href="/account/profile" role="menuitem" onClick={() => setOpen(false)}>
            {t("profileNav")}
          </Link>
          <form action={logoutCustomerAction}>
            <button type="submit" role="menuitem">
              {t("logOut")}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}

function NavIcon({
  children,
  title,
  color,
  href,
}: {
  children: ReactNode;
  title: string;
  color: string;
  href: string;
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
  return (
    <Link href={href} title={title} aria-label={title} style={style}>
      {children}
    </Link>
  );
}

function UserIcon() {
  return (
    <svg width="17" height="17" fill="none" stroke="currentColor" strokeWidth="1.7" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}
