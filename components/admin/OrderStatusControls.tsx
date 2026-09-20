"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import StatusBadge from "@/components/admin/StatusBadge";
import AdminSelect from "@/components/admin/AdminSelect";
import { updateOrderPaymentAction, updateOrderStatusAction } from "@/lib/actions";
import { usePreferences } from "@/lib/preferences";
import { useToast } from "@/lib/toast";
import { FULFILLMENT_STATUSES, type Order, type OrderStatus, type PaymentStatus } from "@/types";
import type { MessageKey } from "@/lib/i18n";

function fulfillmentOptions(current: OrderStatus): OrderStatus[] {
  return current === "paid" ? ["paid", ...FULFILLMENT_STATUSES] : FULFILLMENT_STATUSES;
}

export default function OrderStatusControls({ order }: { order: Order }) {
  const { t } = usePreferences();
  const toast = useToast();
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  function run(
    action: (form: FormData) => Promise<{ ok?: true; error?: string; emailFailed?: boolean }>,
    form: FormData,
    success: string,
  ) {
    startTransition(async () => {
      const result = await action(form);
      if (result.error) {
        toast.error(t("toastError"), result.error);
        return;
      }
      toast.success(success);
      if (result.emailFailed) toast.error(t("orderEmailFailed"), t("adminEmailFailedBody"));
      router.refresh();
    });
  }

  function changeStatus(status: OrderStatus) {
    if (status === order.status) return;
    const form = new FormData();
    form.set("id", order.id);
    form.set("status", status);
    run(updateOrderStatusAction, form, t("toastOrderUpdated"));
  }

  function changePayment(paymentStatus: PaymentStatus) {
    if (paymentStatus === order.paymentStatus) return;
    const form = new FormData();
    form.set("id", order.id);
    form.set("paymentStatus", paymentStatus);
    run(updateOrderPaymentAction, form, t("toastPaymentUpdated"));
  }

  return (
    <div className="admin-order-controls">
      <div className="admin-order-controls__block">
        <span className="admin-label">{t("paymentMethod")}</span>
        <div className="admin-order-controls__row">
          <StatusBadge status={order.paymentStatus} label={t(order.paymentStatus as MessageKey)} />
          {order.paymentStatus === "paid" ? (
            <button type="button" className="admin-text-btn" disabled={pending} onClick={() => changePayment("unpaid")}>
              {t("markUnpaid")}
            </button>
          ) : (
            <button
              type="button"
              className="admin-text-btn admin-text-btn--gold"
              disabled={pending}
              onClick={() => changePayment("paid")}
            >
              {t("markPaid")}
            </button>
          )}
        </div>
      </div>
      <div className="admin-order-controls__block">
        <label className="admin-label" htmlFor="order-status">
          {t("orderStatus")}
        </label>
        <AdminSelect
          id="order-status"
          className="admin-select--compact"
          value={order.status}
          disabled={pending}
          onChange={(status) => changeStatus(status as OrderStatus)}
          aria-label={t("orderStatus")}
          options={fulfillmentOptions(order.status).map((status) => ({
            value: status,
            label: t(status as MessageKey),
          }))}
        />
      </div>
    </div>
  );
}
