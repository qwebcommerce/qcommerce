import type {
  Category,
  Customer,
  CustomerStatus,
  Expense,
  ExpenseCategory,
  ExpenseFile,
  Order,
  OrderItem,
  PaymentStatus,
  Product,
  ProductBadge,
  ProductVariant,
} from "@/types";
import { mapShipments, normalizeProductSource } from "@/lib/dropship";

type ProductRow = {
  id: string;
  name: string;
  name_ar: string | null;
  slug: string;
  description: string | null;
  description_ar: string | null;
  category: string;
  category_slug: string;
  price: number;
  compare_at_price: number | null;
  badge: string | null;
  images: string[];
  sku: string;
  sizes: string[];
  colors: string[];
  stock: number;
  has_variants?: boolean | null;
  variants?: unknown;
  status: "active" | "draft";
  source?: string | null;
  supplier_url?: string | null;
  supplier_product_id?: string | null;
  supplier_stock?: number | null;
  created_at: string;
};

type CategoryRow = {
  id: string;
  parent_id: string | null;
  name: string;
  name_ar: string | null;
  slug: string;
  subtitle: string | null;
  subtitle_ar: string | null;
  image: string | null;
  sort_order: number;
};

type OrderRow = {
  id: string;
  order_number: string;
  customer_id: string | null;
  email: string;
  customer_name: string;
  status: Order["status"];
  payment_status?: PaymentStatus | null;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shipping_address: Order["shippingAddress"];
  notes: string | null;
  shipments?: unknown;
  created_at: string;
};

type CustomerRow = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: Customer["role"];
  status?: CustomerStatus | null;
  password_hash: string | null;
  created_at: string;
};

function mapVariant(raw: Record<string, unknown>, fallbackId: string): ProductVariant {
  const compare = raw.compareAtPrice ?? raw.compare_at_price;
  return {
    id: String(raw.id || fallbackId),
    size: String(raw.size ?? ""),
    color: String(raw.color ?? ""),
    sku: String(raw.sku ?? ""),
    price: Number(raw.price ?? 0),
    compareAtPrice: compare == null || compare === "" ? null : Number(compare),
    stock: Number(raw.stock ?? 0),
    image: String(raw.image ?? ""),
  };
}

export function mapVariants(raw: unknown): ProductVariant[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    .map((item, index) => mapVariant(item, `var_${index}`));
}

export function mapProduct(row: ProductRow): Product {
  const variants = mapVariants(row.variants);
  return {
    id: row.id,
    name: row.name,
    nameAr: row.name_ar ?? "",
    slug: row.slug,
    description: row.description ?? "",
    descriptionAr: row.description_ar ?? "",
    category: row.category,
    categorySlug: row.category_slug,
    price: Number(row.price),
    compareAtPrice: row.compare_at_price == null ? null : Number(row.compare_at_price),
    badge: (row.badge as ProductBadge) ?? null,
    images: row.images ?? [],
    sku: row.sku,
    sizes: row.sizes ?? [],
    colors: row.colors ?? [],
    stock: row.stock,
    hasVariants: Boolean(row.has_variants) || variants.length > 0,
    variants,
    status: row.status,
    source: normalizeProductSource(row.source),
    supplierUrl: row.supplier_url ?? "",
    supplierProductId: row.supplier_product_id ?? "",
    supplierStock: Number(row.supplier_stock ?? row.stock ?? 0),
    createdAt: row.created_at,
  };
}

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    parentId: row.parent_id ?? null,
    name: row.name,
    nameAr: row.name_ar ?? "",
    slug: row.slug,
    subtitle: row.subtitle ?? "",
    subtitleAr: row.subtitle_ar ?? "",
    image: row.image ?? "",
    sortOrder: row.sort_order,
  };
}

export function mapOrder(row: OrderRow): Order {
  const address = row.shipping_address ?? { line1: "", city: "", country: "" };
  const discount = Number(address.discount ?? 0);
  const paymentStatus: PaymentStatus =
    row.payment_status === "paid" || row.payment_status === "unpaid"
      ? row.payment_status
      : row.status === "paid"
        ? "paid"
        : "unpaid";
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    email: row.email,
    customerName: row.customer_name,
    status: row.status,
    paymentStatus,
    items: row.items ?? [],
    subtotal: Number(row.subtotal),
    discount: Number.isFinite(discount) ? discount : 0,
    shipping: Number(row.shipping),
    total: Number(row.total),
    promoCode: String(address.promoCode ?? ""),
    shippingAddress: address,
    paymentMethod: address.paymentMethod === "cod" ? "cod" : "cod",
    notes: row.notes ?? "",
    shipments: mapShipments(row.shipments),
    createdAt: row.created_at,
  };
}

export function mapCustomer(row: CustomerRow): Customer {
  return {
    id: row.id,
    email: row.email,
    fullName: row.full_name,
    phone: row.phone ?? "",
    role: row.role,
    status: row.status === "blocked" ? "blocked" : "active",
    passwordHash: row.password_hash ?? "",
    createdAt: row.created_at,
  };
}

export function productToRow(product: Partial<Product>) {
  return {
    name: product.name,
    name_ar: product.nameAr ?? "",
    slug: product.slug,
    description: product.description,
    description_ar: product.descriptionAr ?? "",
    category: product.category,
    category_slug: product.categorySlug,
    price: product.price,
    compare_at_price: product.compareAtPrice ?? null,
    badge: product.badge ?? null,
    images: product.images,
    sku: product.sku,
    sizes: product.sizes,
    colors: product.colors,
    stock: product.stock,
    has_variants: product.hasVariants ?? false,
    variants: product.variants ?? [],
    status: product.status,
    source: product.source ?? "warehouse",
    supplier_url: product.supplierUrl ?? "",
    supplier_product_id: product.supplierProductId ?? "",
    supplier_stock: product.supplierStock ?? product.stock ?? 0,
  };
}

type ExpenseRow = {
  id: string;
  amount: number | string;
  incurred_on: string;
  category: string;
  subcategory: string;
  notes: string | null;
  files: unknown;
  created_at: string;
};

function mapExpenseFile(raw: unknown): ExpenseFile | null {
  if (!raw || typeof raw !== "object") return null;
  const row = raw as Record<string, unknown>;
  const id = String(row.id ?? "").trim();
  const path = String(row.path ?? "").trim();
  const name = String(row.name ?? "").trim();
  if (!id || !path || !name) return null;
  return {
    id,
    path,
    name,
    size: Number(row.size) || 0,
    type: String(row.type || "application/octet-stream"),
  };
}

export function mapExpense(row: ExpenseRow): Expense {
  const files = Array.isArray(row.files) ? row.files.map(mapExpenseFile).filter((file): file is ExpenseFile => Boolean(file)) : [];
  return {
    id: row.id,
    amount: Number(row.amount) || 0,
    incurredOn: String(row.incurred_on).slice(0, 10),
    category: (row.category as ExpenseCategory) || "shop",
    subcategory: row.subcategory,
    notes: row.notes ?? "",
    files,
    createdAt: row.created_at,
  };
}
