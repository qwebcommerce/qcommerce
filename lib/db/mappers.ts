import type { Category, Customer, Order, OrderItem, Product, ProductBadge } from "@/types";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
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
  status: "active" | "draft";
  created_at: string;
};

type CategoryRow = {
  id: string;
  name: string;
  slug: string;
  subtitle: string | null;
  image: string;
  sort_order: number;
};

type OrderRow = {
  id: string;
  order_number: string;
  customer_id: string | null;
  email: string;
  customer_name: string;
  status: Order["status"];
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shipping_address: Order["shippingAddress"];
  notes: string | null;
  created_at: string;
};

type CustomerRow = {
  id: string;
  email: string;
  full_name: string;
  phone: string | null;
  role: Customer["role"];
  password_hash: string | null;
  created_at: string;
};

export function mapProduct(row: ProductRow): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description ?? "",
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
    status: row.status,
    createdAt: row.created_at,
  };
}

export function mapCategory(row: CategoryRow): Category {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    subtitle: row.subtitle ?? "",
    image: row.image,
    sortOrder: row.sort_order,
  };
}

export function mapOrder(row: OrderRow): Order {
  return {
    id: row.id,
    orderNumber: row.order_number,
    customerId: row.customer_id,
    email: row.email,
    customerName: row.customer_name,
    status: row.status,
    items: row.items ?? [],
    subtotal: Number(row.subtotal),
    shipping: Number(row.shipping),
    total: Number(row.total),
    shippingAddress: row.shipping_address,
    notes: row.notes ?? "",
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
    passwordHash: row.password_hash ?? "",
    createdAt: row.created_at,
  };
}

export function productToRow(product: Partial<Product>) {
  return {
    name: product.name,
    slug: product.slug,
    description: product.description,
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
    status: product.status,
  };
}
