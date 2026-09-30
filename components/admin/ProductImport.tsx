"use client";

import { useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import AdminModal from "@/components/admin/AdminModal";
import StatusBadge from "@/components/admin/StatusBadge";
import { importProductsAction, productImportSampleXlsxAction } from "@/lib/actions";
import { formatQar } from "@/lib/format";
import type { MessageKey } from "@/lib/i18n";
import {
  buildSampleCsv,
  parseProductImportFile,
  PRODUCT_IMPORT_MAX_ROWS,
  validateProductImport,
  type ProductImportIssue,
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

function fieldIssues(row: ProductImportRow, field: ProductImportIssue["field"]) {
  return row.errors.filter((item) => item.field === field);
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
  const [downloading, setDownloading] = useState(false);
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

  function downloadExcelSample() {
    setDownloading(true);
    void (async () => {
      const result = await productImportSampleXlsxAction();
      if (result.error || !result.base64) {
        toast.error(t("toastError"), result.error || t("importFileInvalid"));
      } else {
        const bytes = Uint8Array.from(atob(result.base64), (char) => char.charCodeAt(0));
        downloadBlob(
          new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
          result.filename ?? "product-import-sample.xlsx",
        );
      }
      setDownloading(false);
    })();
  }

  function FieldError({ row, field }: { row: ProductImportRow; field: ProductImportIssue["field"] }) {
    const issues = fieldIssues(row, field);
    if (!issues.length) return null;
    return (
      <>
        {issues.map((item) => (
          <small key={item.key} className="admin-form-error">
            {t(item.key as MessageKey)}
          </small>
        ))}
      </>
    );
  }

  return (
    <>
      <button type="button" className="admin-text-btn" onClick={() => downloadBlob(new Blob([buildSampleCsv(categories)], { type: "text/csv;charset=utf-8" }), "product-import-sample.csv")}>
        {t("downloadSampleCsv")}
      </button>
      <button type="button" className="admin-text-btn" onClick={downloadExcelSample} disabled={downloading || pending}>
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
          <div className="admin-import-list">
            {rows.map((row) => (
              <article key={`${row.row}-${row.sku}`} className={`admin-import-card${row.errors.length ? " is-import-error" : ""}`}>
                <div className="admin-import-card__media">
                  {row.images[0] ? <img src={row.images[0]} alt="" /> : <span />}
                </div>
                <div className="admin-import-card__body">
                  <p className="admin-import-card__kicker">{t("importRow", { row: row.row })}</p>
                  <h3>{row.name || "—"}</h3>
                  <FieldError row={row} field="name" />
                  {row.nameAr ? <b dir="rtl">{row.nameAr}</b> : null}
                  {row.description ? <p className="admin-import-card__desc">{row.description}</p> : null}
                  <div className="admin-import-card__meta">
                    <div>
                      <span>{t("productCategory")}</span>
                      <strong>{row.category || "—"}</strong>
                      <FieldError row={row} field="category" />
                    </div>
                    <div>
                      <span>{t("priceCol")}</span>
                      <strong>{row.price ? formatQar(row.price) : "—"}</strong>
                      <FieldError row={row} field="price" />
                      <FieldError row={row} field="compare_at_price" />
                    </div>
                    <div>
                      <span>{t("sku")}</span>
                      <strong>{row.sku || "—"}</strong>
                      <FieldError row={row} field="sku" />
                    </div>
                    <div>
                      <span>{t("stockCol")}</span>
                      <strong>{String(row.stock)}</strong>
                      <FieldError row={row} field="stock" />
                    </div>
                    <div>
                      <span>{t("status")}</span>
                      <StatusBadge status={row.status} />
                      <FieldError row={row} field="status" />
                    </div>
                    <div>
                      <span>{t("importImagesCount", { count: row.images.length })}</span>
                      <FieldError row={row} field="images" />
                      <FieldError row={row} field="badge" />
                    </div>
                  </div>
                  {row.images.length > 1 ? (
                    <div className="admin-import-card__thumbs">
                      {row.images.slice(1, 5).map((image) => (
                        <img key={image} src={image} alt="" />
                      ))}
                    </div>
                  ) : null}
                </div>
              </article>
            ))}
          </div>
        </AdminModal>
      ) : null}
    </>
  );
}
