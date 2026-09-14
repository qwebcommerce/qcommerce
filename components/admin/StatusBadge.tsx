import type { OrderStatus, ProductStatus } from "@/types";

export default function StatusBadge({ status }: { status: OrderStatus | ProductStatus | string }) {
  return <span className={`status-pill status-pill--${status}`}>{status}</span>;
}
