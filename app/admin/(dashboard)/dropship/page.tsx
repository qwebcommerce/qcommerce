import { notFound } from "next/navigation";
import DropshipManager from "@/components/admin/DropshipManager";
import { DROPSHIP_UI_ENABLED } from "@/lib/dropship";
import { getStoreSettings, listCategories, listOrders } from "@/lib/db";

export const metadata = { title: "Dropshipping" };

export default async function AdminDropshipPage() {
  if (!DROPSHIP_UI_ENABLED) notFound();
  const [settings, categories, orders] = await Promise.all([
    getStoreSettings(),
    listCategories(),
    listOrders(),
  ]);
  const rows = orders.flatMap((order) =>
    (order.shipments ?? [])
      .filter((shipment) => shipment.status === "pending" || shipment.status === "failed")
      .map((shipment) => ({ order, shipment })),
  );
  return <DropshipManager settings={settings} categories={categories} rows={rows} />;
}
