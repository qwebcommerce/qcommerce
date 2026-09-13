import type { OrderStatus, ProductStatus } from "@/types";

const COLORS: Record<string, { bg: string; color: string }> = {
  pending: { bg: "#F2EFE9", color: "#8B6914" },
  paid: { bg: "#E8F5E9", color: "#1B5E20" },
  processing: { bg: "#FFF3E0", color: "#E65100" },
  shipped: { bg: "#E3F2FD", color: "#0D47A1" },
  delivered: { bg: "#E8F5E9", color: "#1B5E20" },
  cancelled: { bg: "#FFEBEE", color: "#B71C1C" },
  active: { bg: "#E8F5E9", color: "#1B5E20" },
  draft: { bg: "#F2EFE9", color: "#6B6868" },
};

export default function StatusBadge({ status }: { status: OrderStatus | ProductStatus | string }) {
  const style = COLORS[status] ?? { bg: "#F2EFE9", color: "#6B6868" };
  return (
    <span className="status-pill" style={{ background: style.bg, color: style.color }}>
      {status}
    </span>
  );
}
