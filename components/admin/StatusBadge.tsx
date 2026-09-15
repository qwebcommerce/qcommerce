import type { OrderStatus, ProductStatus } from "@/types";

export default function StatusBadge({
  status,
  label,
}: {
  status: OrderStatus | ProductStatus | string;
  label?: string;
}) {
  return <span className={`status-pill status-pill--${status}`}>{label ?? status}</span>;
}
