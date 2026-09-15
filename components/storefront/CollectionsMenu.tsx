"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { nestCategories, localizedCategoryName } from "@/lib/categories";
import { usePreferences } from "@/lib/preferences";
import type { Category } from "@/types";

export default function CollectionsMenu({
  color,
  open,
  onOpen,
  onToggle,
}: {
  color: string;
  open: boolean;
  onOpen: () => void;
  onClose?: () => void;
  onToggle: () => void;
}) {
  const { t } = usePreferences();
  return (
    <button
      type="button"
      className={`nav-link nav-mega-trigger${open ? " is-open" : ""}`}
      style={{ color }}
      aria-expanded={open}
      aria-haspopup="true"
      aria-controls="collections-menu"
      onClick={onToggle}
      onMouseEnter={onOpen}
    >
      {t("collections")}
      <ChevronDown />
    </button>
  );
}

export function CollectionsPanel({
  categories,
  open,
  onOpen,
  onClose,
}: {
  categories: Category[];
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
}) {
  const { t, locale } = usePreferences();
  const pathname = usePathname();
  const tree = nestCategories(categories);
  const closeOnRoute = useRef(pathname);

  useEffect(() => {
    if (closeOnRoute.current === pathname) return;
    closeOnRoute.current = pathname;
    onClose();
  }, [pathname, onClose]);

  if (!open) return null;

  return (
    <div className="mega-layer">
      <button type="button" className="mega-backdrop" aria-label={t("close")} onClick={onClose} />
      <div
        id="collections-menu"
        className="mega-panel"
        onMouseEnter={onOpen}
        role="menu"
        aria-label={t("collections")}
      >
        <div className="mega-panel__inner">
          <div className="mega-panel__head">
            <p>{t("shopByCategory")}</p>
            <Link href="/shop" className="mega-panel__all" onClick={onClose}>
              {t("viewAllProducts")}
            </Link>
          </div>
          {tree.length === 0 ? (
            <p className="mega-panel__empty">{t("noCategories")}</p>
          ) : (
            <div className="mega-grid">
              {tree.map((category) => (
                <div key={category.id} className="mega-col">
                  <Link href={`/shop/${category.slug}`} className="mega-col__title" onClick={onClose}>
                    {localizedCategoryName(category, locale)}
                  </Link>
                  {category.children.length > 0 ? (
                    <ul className="mega-col__subs">
                      {category.children.map((child) => (
                        <li key={child.id}>
                          <Link href={`/shop/${child.slug}`} onClick={onClose}>
                            {localizedCategoryName(child, locale)}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ChevronDown() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path d="M2.4 4.4 6 8l3.6-3.6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
