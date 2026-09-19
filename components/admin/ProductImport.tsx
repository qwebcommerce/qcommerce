"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AdminModal from "@/components/admin/AdminModal";
import { importProductsAction } from "@/lib/actions";
import { formatQar } from "@/lib/format";
import {
  buildSampleCsv,
  buildSampleXlsx,
  parseProductImportFile,
  PRODUCT_IMPORT_GUIDE,
  PRODUCT_IMPORT_MAX_ROWS,
  validateProductImport,
  type ProductImportRow,
} from "@/lib/product-import";
import { usePreferences } from "@/lib/preferences";
import { useToast } from "@/lib/toast";
import type { Category, Product } from "@/types";

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

export default function ProductImport({
  categories,
  products,
}: {
  categories: Category[];
  products: Product[];
}) {
  const { t } = usePreferences();
  const toast = useToast();
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, startTransition] = useTransition();
  const [reading, setReading] = useState(false);
  const [error, setError] = useState("");
  const [records, setRecords] = useState<Record<string, unknown>[] | null>(null);
  const [rows, setRows] = useState<ProductImportRow[]>([]);

  const invalidCount = rows.filter((row) => row.errors.length).length;
  const canConfirm = rows.length > 0 && invalidCount === 0 && !pending;

  function closePreview() {
    if (pending) return;
    setRecords(null);
    setRows([]);
    setError("");
    if (inputRef.current) inputRef.current.value = "";
  }

  async function onFile(file: File | undefined) {
    if (!file) return;
    setReading(true);
    setError("");
    try {
      const parsed = await parseProductImportFile(file);
      const preview = validateProductImport(parsed, categories, products);
      if (preview.error) {
        setError(preview.error);
        toast.error(t("toastError"), preview.error);
        return;
      }
      setRecords(parsed);
      setRows(preview.rows);
    } catch {
      const message = t("importFileInvalid");
      setError(message);
      toast.error(t("toastError"), message);
    } finally {
      setReading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function confirmImport() {
    if (!records || !canConfirm) return;
    startTransition(async () => {
      const result = await importProductsAction(records);
      if (result.error) {
        setError(result.error);
        toast.error(t("toastError"), result.error);
        return;
      }
      toast.success(t("toastProductsImported", { count: result.count ?? rows.length }));
      closePreview();
      router.refresh();
    });
  }

  return (
    <>
      <button type="button" className="admin-text-btn" onClick={() => downloadBlob(new Blob([buildSampleCsv(categories)], { type: "text/csv;charset=utf-8" }), "product-import-sample.csv")}>
        {t("downloadSampleCsv")}
      </button>
      <button
        type="button"
        className="admin-text-btn"
        onClick={async () => downloadBlob(await buildSampleXlsx(categories), "product-import-sample.xlsx")}
      >
        {t("downloadSampleExcel")}
      </button>
      <button type="button" className="btn-gold btn-compact" disabled={reading} onClick={() => inputRef.current?.click()}>
        {reading ? t("importReading") : t("importProducts")}
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv,.xlsx,.xls,text/csv,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        className="sr-only"
        onChange={(event) => onFile(event.target.files?.[0])}
      />

      {records ? (
        <AdminModal
          wide
          title={t("importPreviewTitle")}
          onClose={closePreview}
          footer={
            <>
              <button type="button" className="admin-text-btn" onClick={closePreview} disabled={pending}>
                {t("cancel")}
              </button>
              <button type="button" className="btn-gold btn-compact" onClick={confirmImport} disabled={!canConfirm}>
                {pending ? t("saving") : t("confirmImport", { count: rows.length })}
              </button>
            </>
          }
        >
          <p className="admin-modal-note">{t("importPreviewIntro", { count: rows.length, max: PRODUCT_IMPORT_MAX_ROWS })}</p>
          {invalidCount ? (
            <p className="admin-form-error">{t("importHasErrors", { count: invalidCount })}</p>
          ) : (
            <p className="admin-modal-note">{t("importConfirmHint")}</p>
          )}
          {error ? <p className="admin-form-error">{error}</p> : null}
          <div className="admin-import-table-wrap">
            <table className="admin-table admin-import-table">
              <thead>
                <tr>
                  <th>#</th>
                  <th>{t("productsNav")}</th>
                  <th>{t("productCategory")}</th>
                  <th>{t("priceCol")}</th>
                  <th>{t("sku")}</th>
                  <th>{t("stockCol")}</th>
                  <th>{t("status")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.row}-${row.sku}`} className={row.errors.length ? "is-import-error" : undefined}>
                    <td>{row.row}</td>
                    <td>
                      <strong>{row.name || "—"}</strong>
                      {row.nameAr ? <b dir="rtl">{row.nameAr}</b> : null}
                      <span>{row.images.length ? t("importImagesCount", { count: row.images.length }) : t("importNoImages")}</span>
                      {row.errors.length ? <small className="admin-form-error">{row.errors.join(", ")}</small> : null}
                    </td>
                    <td>{row.category || "—"}</td>
                    <td>{row.price ? formatQar(row.price) : "—"}</td>
                    <td>{row.sku || "—"}</td>
                    <td>{row.stock}</td>
                    <td>{row.status}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <details className="admin-import-guide">
            <summary>{t("importGuideTitle")}</summary>
            <ul>
              {PRODUCT_IMPORT_GUIDE.map((item) => (
                <li key={item.column}>
                  <strong>{item.column}</strong>
                  {item.required ? ` · ${t("importRequired")}` : ` · ${t("importOptional")}`}
                  <span>{item.format}</span>
                </li>
              ))}
            </ul>
          </details>
        </AdminModal>
      ) : null}
    </>
  );
}
