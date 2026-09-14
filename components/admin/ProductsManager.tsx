"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminModal from "@/components/admin/AdminModal";
import StatusBadge from "@/components/admin/StatusBadge";
import { deleteProductAction } from "@/lib/actions";
import { formatQar } from "@/lib/format";
import { matchesProductSearch, productPriceRange, productStock } from "@/lib/products";
import { usePreferences } from "@/lib/preferences";
import { useToast } from "@/lib/toast";
import type { Product } from "@/types";

const PAGE_SIZE = 8;

export default function ProductsManager({
  products,
  initialQuery = "",
}: {
  products: Product[];
  initialQuery?: string;
}) {
  const { t } = usePreferences();
  const toast = useToast();
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery);
  const [page, setPage] = useState(1);
  const [pending, startTransition] = useTransition();
  const [deleting, setDeleting] = useState<Product | null>(null);
  const [error, setError] = useState("");
  const filtered = useMemo(
    () => products.filter((product) => matchesProductSearch(product, query)),
    [products, query],
  );
  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const from = filtered.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0;
  const to = Math.min(currentPage * PAGE_SIZE, filtered.length);

  useEffect(() => {
    setQuery(initialQuery);
    setPage(1);
  }, [initialQuery]);

  useEffect(() => {
    setPage(1);
  }, [query]);

  useEffect(() => {
    if (page > pageCount) setPage(pageCount);
  }, [page, pageCount]);

  function confirmDelete() {
    if (!deleting) return;
    const form = new FormData();
    form.set("id", deleting.id);
    startTransition(async () => {
      const result = await deleteProductAction(form);
      if (result.error) {
        setError(result.error);
        toast.error(t("toastError"), result.error);
        return;
      }
      toast.success(t("toastProductDeleted"));
      setDeleting(null);
      setError("");
      router.refresh();
    });
  }

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">{t("admin")}</p>
          <h1 className="admin-title">{t("productsNav")}</h1>
        </div>
        <div className="admin-page-head__actions">
          <Link href="/admin/products/new" className="btn-gold btn-compact">
            {t("addProduct")}
          </Link>
        </div>
      </div>
      <p className="admin-lead">{t("productsIntro")}</p>
      {products.length > 0 ? (
        <div className="admin-toolbar">
          <label className="admin-search">
            <SearchIcon />
            <span className="sr-only">{t("productSearch")}</span>
            <input
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder={t("productSearch")}
            />
          </label>
        </div>
      ) : null}

      {products.length === 0 ? (
        <section className="admin-panel">
          <p className="admin-empty">{t("noProductsAdmin")}</p>
        </section>
      ) : filtered.length === 0 ? (
        <section className="admin-panel">
          <p className="admin-empty">{t("noSearchResults")}</p>
        </section>
      ) : (
        <>
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("productsNav")}</th>
                  <th>{t("productCategory")}</th>
                  <th>{t("priceCol")}</th>
                  <th>{t("stockCol")}</th>
                  <th>{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {visible.map((product) => (
                  <tr key={product.id}>
                    <td>
                      <div className="admin-table__product">
                        <div className="admin-table__thumb">
                          {product.images[0] ? <img src={product.images[0]} alt="" /> : <span />}
                        </div>
                        <div>
                          <strong>{product.name}</strong>
                          {product.nameAr ? <b dir="rtl">{product.nameAr}</b> : null}
                          <span>
                            {product.sku}
                            {product.hasVariants ? ` · ${t("variantCount", { count: product.variants.length })}` : ""}
                          </span>
                          <div className="admin-table__actions">
                            <Link href={`/admin/products/${product.id}`} className="admin-text-btn">
                              {t("edit")}
                            </Link>
                            <button
                              type="button"
                              className="admin-text-btn admin-text-btn--danger"
                              onClick={() => {
                                setError("");
                                setDeleting(product);
                              }}
                            >
                              {t("delete")}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td>{product.category}</td>
                    <td>
                      {(() => {
                        const range = productPriceRange(product);
                        return range.min !== range.max
                          ? t("fromPrice", { price: formatQar(range.min) })
                          : formatQar(range.min);
                      })()}
                    </td>
                    <td className={productStock(product) < 5 ? "is-critical" : undefined}>{productStock(product)}</td>
                    <td>
                      <StatusBadge status={product.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="admin-pager">
            <p>{t("showingCount", { from, to, total: filtered.length })}</p>
            <div className="admin-pager__btns">
              <button type="button" className="admin-text-btn" disabled={currentPage <= 1} onClick={() => setPage(currentPage - 1)}>
                {t("previous")}
              </button>
              <span>{t("pageOf", { page: currentPage, pages: pageCount })}</span>
              <button type="button" className="admin-text-btn" disabled={currentPage >= pageCount} onClick={() => setPage(currentPage + 1)}>
                {t("next")}
              </button>
            </div>
          </div>
        </>
      )}

      {deleting ? (
        <AdminModal
          title={t("deleteProductTitle")}
          onClose={() => (pending ? undefined : setDeleting(null))}
          footer={
            <>
              <button type="button" className="admin-text-btn" onClick={() => setDeleting(null)} disabled={pending}>
                {t("cancel")}
              </button>
              <button type="button" className="btn-gold btn-compact btn-danger" onClick={confirmDelete} disabled={pending}>
                {pending ? t("saving") : t("delete")}
              </button>
            </>
          }
        >
          {error ? <p className="admin-form-error">{error}</p> : null}
          <p className="admin-modal-note">{t("confirmDeleteProduct", { name: deleting.name })}</p>
        </AdminModal>
      ) : null}
    </div>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="11" cy="11" r="6.25" stroke="currentColor" strokeWidth="1.7" />
      <path d="M16 16.5 20 20.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    </svg>
  );
}
