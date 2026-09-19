"use client";

import { useState, useTransition, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/admin/StatusBadge";
import { importDropshipProductAction, retryDropshipShipmentAction } from "@/lib/actions";
import { nestCategories } from "@/lib/categories";
import { canManualRetry } from "@/lib/dropship";
import { formatDate } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { useToast } from "@/lib/toast";
import type { Category, DropshipShipment, Order, StoreSettings } from "@/types";
import type { MessageKey } from "@/lib/i18n";

type ShipmentRow = {
  order: Order;
  shipment: DropshipShipment;
};

export default function DropshipManager({
  settings,
  categories,
  rows,
}: {
  settings: StoreSettings;
  categories: Category[];
  rows: ShipmentRow[];
}) {
  const { t } = usePreferences();
  const toast = useToast();
  const router = useRouter();
  const tree = nestCategories(categories);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  function importProduct(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const result = await importDropshipProductAction(formData);
      if (result.error || !result.productId) {
        setError(result.error ?? t("toastError"));
        toast.error(t("toastError"), result.error ?? t("toastError"));
        return;
      }
      toast.success(t("toastDropshipImported"));
      router.push(`/admin/products/${result.productId}`);
      router.refresh();
    });
  }

  function retry(orderId: string, shipmentId: string) {
    const form = new FormData();
    form.set("orderId", orderId);
    form.set("shipmentId", shipmentId);
    startTransition(async () => {
      const result = await retryDropshipShipmentAction(form);
      if (result.error) {
        toast.error(t("toastError"), result.error);
        return;
      }
      toast.success(t("toastDropshipRetried"));
      router.refresh();
    });
  }

  return (
    <div>
      <div className="admin-page-head">
        <div>
          <p className="admin-kicker">{t("admin")}</p>
          <h1 className="admin-title">{t("dropshipNav")}</h1>
        </div>
      </div>
      <p className="admin-lead">{t("dropshipIntro")}</p>
      <p className="admin-field-hint" style={{ margin: "0 0 1.15rem" }}>
        {settings.dropshipEnabled ? t("dropshipEnabledHint") : t("dropshipDisabledHint")}
      </p>

      <form onSubmit={importProduct} className="admin-form-card" style={{ marginBottom: "1.5rem" }}>
        <p className="admin-kicker">{t("importDropship")}</p>
        {error ? <p className="admin-form-error">{error}</p> : null}
        <label>
          <span className="admin-label">{t("supplierUrl")}</span>
          <input name="url" required className="admin-input" placeholder="https://www.aliexpress.com/item/..." />
        </label>
        <div className="admin-form-grid">
          <label>
            <span className="admin-label">{t("productCategory")}</span>
            <select name="categoryId" className="admin-select" required defaultValue={tree[0]?.id ?? ""}>
              {tree.map((parent) =>
                parent.children.length ? (
                  <optgroup key={parent.id} label={parent.name}>
                    <option value={parent.id}>{parent.name}</option>
                    {parent.children.map((child) => (
                      <option key={child.id} value={child.id}>
                        {parent.name} / {child.name}
                      </option>
                    ))}
                  </optgroup>
                ) : (
                  <option key={parent.id} value={parent.id}>
                    {parent.name}
                  </option>
                ),
              )}
            </select>
          </label>
          <label>
            <span className="admin-label">{t("priceLabel")}</span>
            <input name="price" required className="admin-input" inputMode="decimal" />
          </label>
          <label>
            <span className="admin-label">{t("nameEnglish")}</span>
            <input name="name" className="admin-input" placeholder={t("dropshipNameHint")} />
          </label>
        </div>
        <small className="admin-field-hint">{t("dropshipImportHint")}</small>
        <div className="admin-form-actions">
          <button type="submit" className="btn-gold" disabled={pending || tree.length === 0}>
            {pending ? t("saving") : t("importToDraft")}
          </button>
        </div>
      </form>

      <section className="admin-panel">
        <p className="admin-kicker">{t("dropshipQueue")}</p>
        {rows.length === 0 ? (
          <p className="admin-empty">{t("noDropshipShipments")}</p>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>{t("order")}</th>
                  <th>{t("productSource")}</th>
                  <th>{t("status")}</th>
                  <th>{t("dateCol")}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {rows.map(({ order, shipment }) => (
                  <tr key={`${order.id}-${shipment.id}`}>
                    <td>
                      <strong>{order.orderNumber}</strong>
                      <div className="admin-table__actions">
                        <Link href={`/admin/orders/${order.id}`} className="admin-text-btn">
                          {t("viewOrder")}
                        </Link>
                      </div>
                    </td>
                    <td>
                      {shipment.source === "temu" ? t("sourceTemu") : t("sourceAliexpress")}
                      {shipment.supplierProductId ? ` · ${shipment.supplierProductId}` : ""}
                      <div>× {shipment.quantity}</div>
                    </td>
                    <td>
                      <StatusBadge status={shipment.status} label={t(shipment.status as MessageKey)} />
                      {shipment.lastError ? <small className="admin-field-hint">{shipment.lastError}</small> : null}
                    </td>
                    <td>{formatDate(shipment.lastAttemptAt || shipment.createdAt)}</td>
                    <td>
                      {canManualRetry(shipment) ? (
                        <button
                          type="button"
                          className="admin-text-btn admin-text-btn--gold"
                          disabled={pending}
                          onClick={() => retry(order.id, shipment.id)}
                        >
                          {t("retrySupplier")}
                        </button>
                      ) : null}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
