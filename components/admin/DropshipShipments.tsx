"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/admin/StatusBadge";
import { retryDropshipShipmentAction } from "@/lib/actions";
import { canManualRetry } from "@/lib/dropship";
import { formatDate } from "@/lib/format";
import { usePreferences } from "@/lib/preferences";
import { useToast } from "@/lib/toast";
import type { Order } from "@/types";
import type { MessageKey } from "@/lib/i18n";

export default function DropshipShipments({ order }: { order: Order }) {
  const { t } = usePreferences();
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const shipments = order.shipments ?? [];
  if (!shipments.length) return null;

  function retry(shipmentId: string) {
    const form = new FormData();
    form.set("orderId", order.id);
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
    <section className="admin-panel" style={{ marginBottom: "1.25rem" }}>
      <h2 style={{ fontWeight: 800, marginBottom: "0.75rem" }}>{t("dropshipShipments")}</h2>
      {shipments.map((shipment) => (
        <div
          key={shipment.id}
          style={{
            display: "grid",
            gap: "0.35rem",
            padding: "0.75rem 0",
            borderBottom: "1px solid var(--off-white)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", gap: "1rem", flexWrap: "wrap" }}>
            <strong>
              {shipment.source === "temu" ? t("sourceTemu") : t("sourceAliexpress")} × {shipment.quantity}
            </strong>
            <StatusBadge status={shipment.status} label={t(shipment.status as MessageKey)} />
          </div>
          {shipment.supplierProductId ? <p style={{ color: "var(--muted)" }}>{shipment.supplierProductId}</p> : null}
          {shipment.supplierUrl ? (
            <a href={shipment.supplierUrl} target="_blank" rel="noreferrer" className="admin-text-btn">
              {t("supplierUrl")}
            </a>
          ) : null}
          {shipment.supplierOrderId ? <p>{t("supplierOrderId")}: {shipment.supplierOrderId}</p> : null}
          {shipment.trackingNumber ? <p>{t("trackingNumber")}: {shipment.trackingNumber}</p> : null}
          {shipment.lastError ? <p style={{ color: "var(--sale)" }}>{shipment.lastError}</p> : null}
          <p style={{ color: "var(--muted)" }}>
            {t("retryUntil")}: {formatDate(shipment.retryUntil)}
            {shipment.attempts ? ` · ${t("attemptsCount", { count: shipment.attempts })}` : ""}
          </p>
          {canManualRetry(shipment) ? (
            <button
              type="button"
              className="admin-text-btn admin-text-btn--gold"
              disabled={pending}
              onClick={() => retry(shipment.id)}
            >
              {pending ? t("saving") : t("retrySupplier")}
            </button>
          ) : null}
        </div>
      ))}
    </section>
  );
}
