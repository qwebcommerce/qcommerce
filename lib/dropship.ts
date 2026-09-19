import { productStock } from "@/lib/products";
import type {
  DropshipShipment,
  DropshipShipmentStatus,
  DropshipSource,
  Order,
  OrderItem,
  Product,
  ProductSource,
  ShippingAddress,
} from "@/types";

export const DEFAULT_DROPSHIP_BUFFER = 3;
/** Flip to true when the client is ready to use dropshipping in admin and on the shop. */
export const DROPSHIP_UI_ENABLED = false;

export function isDropshipSource(source?: string): source is DropshipSource {
  return source === "aliexpress" || source === "temu";
}

export function normalizeProductSource(value?: string | null): ProductSource {
  return isDropshipSource(value ?? "") ? value as DropshipSource : "warehouse";
}

export function sellableStock(
  product: Pick<Product, "source" | "stock" | "supplierStock" | "hasVariants" | "variants">,
  buffer = DEFAULT_DROPSHIP_BUFFER,
) {
  if (!isDropshipSource(product.source)) return productStock(product);
  const raw = Number.isFinite(product.supplierStock) ? product.supplierStock : productStock(product);
  return Math.max(0, raw - Math.max(0, buffer));
}

export function isListedOnShop(
  product: Pick<Product, "status" | "source" | "stock" | "supplierStock" | "hasVariants" | "variants">,
  buffer = DEFAULT_DROPSHIP_BUFFER,
) {
  if (product.status !== "active") return false;
  if (!isDropshipSource(product.source)) return true;
  if (!DROPSHIP_UI_ENABLED) return false;
  return sellableStock(product, buffer) > 0;
}

export type ParsedSupplierUrl = {
  source: DropshipSource;
  supplierUrl: string;
  supplierProductId: string;
  title: string;
  sku: string;
};

function cleanUrl(value: string) {
  try {
    const url = new URL(value.trim());
    url.hash = "";
    return url;
  } catch {
    return null;
  }
}

function titleFromPath(pathname: string, fallback: string) {
  const last = pathname.split("/").filter(Boolean).pop() ?? "";
  const cleaned = decodeURIComponent(last)
    .replace(/\.html$/i, "")
    .replace(/[-_]+/g, " ")
    .replace(/\b(g|item)\b/gi, "")
    .replace(/\d{8,}/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned ? cleaned.replace(/\b\w/g, (char) => char.toUpperCase()) : fallback;
}

export function parseSupplierUrl(raw: string): ParsedSupplierUrl | { error: string } {
  const url = cleanUrl(raw);
  if (!url) return { error: "Enter a valid AliExpress or Temu product URL." };

  const host = url.hostname.replace(/^www\./, "").toLowerCase();
  const href = url.toString();

  if (host.includes("aliexpress.")) {
    const fromPath = url.pathname.match(/\/item\/(\d+)/i)?.[1];
    const fromQuery = url.searchParams.get("item_ids") || url.searchParams.get("productId");
    const id = (fromPath || fromQuery || "").replace(/\D/g, "");
    if (!id) return { error: "Could not read an AliExpress product id from that URL." };
    return {
      source: "aliexpress",
      supplierUrl: href,
      supplierProductId: id,
      title: titleFromPath(url.pathname, `AliExpress ${id}`),
      sku: `AE-${id}`.slice(0, 40),
    };
  }

  if (host.includes("temu.")) {
    const fromPath =
      url.pathname.match(/-g-(\d+)/i)?.[1] ||
      url.pathname.match(/\/g-(\d+)/i)?.[1] ||
      url.pathname.match(/goods[_-]?id[_-]?(\d+)/i)?.[1];
    const fromQuery = url.searchParams.get("goods_id") || url.searchParams.get("goodsId");
    const id = (fromPath || fromQuery || "").replace(/\D/g, "");
    if (!id) return { error: "Could not read a Temu product id from that URL." };
    return {
      source: "temu",
      supplierUrl: href,
      supplierProductId: id,
      title: titleFromPath(url.pathname, `Temu ${id}`),
      sku: `TM-${id}`.slice(0, 40),
    };
  }

  return { error: "Use an AliExpress or Temu product URL." };
}

export function retryUntilFrom(now = new Date()) {
  return now.toISOString();
}

export function canManualRetry(shipment: Pick<DropshipShipment, "status">) {
  return shipment.status === "pending" || shipment.status === "failed";
}

export function buildShipment(item: OrderItem, now = new Date()): DropshipShipment | null {
  if (!isDropshipSource(item.source)) return null;
  return {
    id: crypto.randomUUID(),
    productId: item.productId,
    variantId: item.variantId,
    source: item.source,
    supplierProductId: item.supplierProductId || "",
    supplierUrl: item.supplierUrl || "",
    quantity: item.quantity,
    status: "pending",
    attempts: 0,
    retryUntil: retryUntilFrom(now),
    createdAt: now.toISOString(),
  };
}

export function mapShipments(raw: unknown): DropshipShipment[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item, index) => {
      const status = String(item.status ?? "pending") as DropshipShipmentStatus;
      const source = isDropshipSource(String(item.source ?? "")) ? (item.source as DropshipSource) : "aliexpress";
      return {
        id: String(item.id || `ship_${index}`),
        productId: String(item.productId ?? ""),
        variantId: item.variantId ? String(item.variantId) : undefined,
        source,
        supplierProductId: String(item.supplierProductId ?? ""),
        supplierUrl: String(item.supplierUrl ?? ""),
        quantity: Number(item.quantity ?? 1) || 1,
        status: ["pending", "placed", "failed", "cancelled"].includes(status) ? status : "pending",
        supplierOrderId: item.supplierOrderId ? String(item.supplierOrderId) : undefined,
        trackingNumber: item.trackingNumber ? String(item.trackingNumber) : undefined,
        lastError: item.lastError ? String(item.lastError) : undefined,
        attempts: Number(item.attempts ?? 0) || 0,
        retryUntil: String(item.retryUntil || retryUntilFrom()),
        lastAttemptAt: item.lastAttemptAt ? String(item.lastAttemptAt) : undefined,
        createdAt: String(item.createdAt || new Date().toISOString()),
      };
    });
}

export type SupplierPlaceResult =
  | { ok: true; supplierOrderId: string; trackingNumber?: string }
  | { ok: false; error: string };

function supplierConfigured(source: DropshipSource) {
  if (source === "aliexpress") {
    return Boolean(process.env.ALIEXPRESS_APP_KEY && process.env.ALIEXPRESS_APP_SECRET);
  }
  return Boolean(process.env.TEMU_APP_KEY && process.env.TEMU_APP_SECRET);
}

export async function placeSupplierOrder(input: {
  enabled: boolean;
  source: DropshipSource;
  supplierProductId: string;
  quantity: number;
  address: ShippingAddress;
}): Promise<SupplierPlaceResult> {
  if (!input.enabled) {
    return { ok: false, error: "Dropshipping is disabled. Connect supplier APIs before enabling it." };
  }
  if (!input.supplierProductId) {
    return { ok: false, error: "This product is missing a supplier id." };
  }
  if (!input.address.line1 || !input.address.city || !input.address.country) {
    return { ok: false, error: "A complete shipping address is required to place with the supplier." };
  }
  if (!supplierConfigured(input.source)) {
    const name = input.source === "aliexpress" ? "AliExpress" : "Temu";
    return { ok: false, error: `${name} API keys are not configured yet.` };
  }
  return { ok: false, error: "Supplier placement is stubbed until live API credentials are connected." };
}

export function applyShipmentAttempt(shipment: DropshipShipment, result: SupplierPlaceResult): DropshipShipment {
  const now = new Date().toISOString();
  if (result.ok) {
    return {
      ...shipment,
      status: "placed",
      attempts: shipment.attempts + 1,
      lastAttemptAt: now,
      lastError: undefined,
      supplierOrderId: result.supplierOrderId,
      trackingNumber: result.trackingNumber,
    };
  }
  return {
    ...shipment,
    status: "failed",
    attempts: shipment.attempts + 1,
    lastAttemptAt: now,
    lastError: result.error,
  };
}

export function orderHasOpenShipments(order: Pick<Order, "shipments">) {
  return (order.shipments ?? []).some((shipment) => shipment.status === "pending" || shipment.status === "failed");
}
