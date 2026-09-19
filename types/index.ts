export type ProductBadge = "NEW" | "SALE" | "BESTSELLER" | "TRENDING" | null;
export type ProductStatus = "active" | "draft";
export type ProductSource = "warehouse" | "aliexpress" | "temu";
export type DropshipSource = "aliexpress" | "temu";
export type DropshipShipmentStatus = "pending" | "placed" | "failed" | "cancelled";
export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
export type PaymentStatus = "unpaid" | "paid";
export type CustomerStatus = "active" | "blocked";
export type UserRole = "customer" | "admin";

export const ORDER_STATUSES: OrderStatus[] = [
  "pending",
  "paid",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];
export const FULFILLMENT_STATUSES: OrderStatus[] = [
  "pending",
  "processing",
  "shipped",
  "delivered",
  "cancelled",
];

export type Category = {
  id: string;
  parentId: string | null;
  name: string;
  nameAr: string;
  slug: string;
  subtitle: string;
  subtitleAr: string;
  image: string;
  sortOrder: number;
};

export type CategoryInput = {
  id?: string;
  parentId?: string | null;
  name: string;
  nameAr?: string;
  slug?: string;
  subtitle?: string;
  subtitleAr?: string;
  image?: string;
  sortOrder?: number;
};

export type ProductVariant = {
  id: string;
  size: string;
  color: string;
  sku: string;
  price: number;
  compareAtPrice: number | null;
  stock: number;
  image: string;
};

export type Product = {
  id: string;
  name: string;
  nameAr: string;
  slug: string;
  description: string;
  descriptionAr: string;
  category: string;
  categorySlug: string;
  price: number;
  compareAtPrice: number | null;
  badge: ProductBadge;
  images: string[];
  sku: string;
  sizes: string[];
  colors: string[];
  stock: number;
  hasVariants: boolean;
  variants: ProductVariant[];
  status: ProductStatus;
  source: ProductSource;
  supplierUrl: string;
  supplierProductId: string;
  supplierStock: number;
  createdAt: string;
};

export type CartLine = {
  id: string;
  productId: string;
  name: string;
  slug: string;
  image: string;
  price: number;
  quantity: number;
  size?: string;
  color?: string;
  variantId?: string;
  source?: ProductSource;
  supplierProductId?: string;
  supplierUrl?: string;
};

export type OrderItem = Omit<CartLine, "id">;

export type PaymentMethod = "cod";

export type DropshipShipment = {
  id: string;
  productId: string;
  variantId?: string;
  source: DropshipSource;
  supplierProductId: string;
  supplierUrl: string;
  quantity: number;
  status: DropshipShipmentStatus;
  supplierOrderId?: string;
  trackingNumber?: string;
  lastError?: string;
  attempts: number;
  retryUntil: string;
  lastAttemptAt?: string;
  createdAt: string;
};

export type ShippingAddress = {
  line1: string;
  city: string;
  country: string;
  postalCode?: string;
  area?: string;
  phone?: string;
  paymentMethod?: PaymentMethod;
  promoCode?: string;
  discount?: number;
  promoPercent?: number;
  isGuest?: boolean;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string | null;
  email: string;
  customerName: string;
  status: OrderStatus;
  paymentStatus: PaymentStatus;
  items: OrderItem[];
  subtotal: number;
  discount: number;
  shipping: number;
  total: number;
  promoCode: string;
  shippingAddress: ShippingAddress;
  paymentMethod: PaymentMethod;
  notes: string;
  shipments: DropshipShipment[];
  createdAt: string;
};

export type Customer = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  status: CustomerStatus;
  passwordHash: string;
  createdAt: string;
};

export type NewsletterEntry = {
  id: string;
  email: string;
  createdAt: string;
};

export type ProductFilters = {
  category?: string;
  q?: string;
  sort?: "newest" | "oldest" | "price-asc" | "price-desc" | "name" | "name-desc";
  status?: ProductStatus;
};

export type ProductInput = {
  name: string;
  nameAr?: string;
  slug?: string;
  description: string;
  descriptionAr?: string;
  category: string;
  categorySlug: string;
  price: number;
  compareAtPrice?: number | null;
  badge?: ProductBadge;
  images: string[];
  sku: string;
  sizes: string[];
  colors: string[];
  stock: number;
  hasVariants?: boolean;
  variants?: ProductVariant[];
  status: ProductStatus;
  source?: ProductSource;
  supplierUrl?: string;
  supplierProductId?: string;
  supplierStock?: number;
};

export type OrderInput = {
  customerId?: string | null;
  email: string;
  customerName: string;
  items: OrderItem[];
  notes?: string;
  paymentMethod?: PaymentMethod;
  promoCode?: string;
  shippingAddress: ShippingAddress;
};

export type CustomerInput = {
  email: string;
  fullName: string;
  phone?: string;
  password: string;
};

export type DashboardStats = {
  revenue: number;
  orderCount: number;
  productCount: number;
  customerCount: number;
  pendingOrders: number;
  lowStock: number;
};

export type StoreSettings = {
  freeShippingFrom: number;
  shippingFee: number;
  returnDays: number;
  promoCode: string;
  promoPercent: number;
  dropshipEnabled: boolean;
  dropshipBuffer: number;
};

export type ExpenseCategory = "home" | "shop" | "salary" | "marketing";

export type ExpenseFile = {
  id: string;
  path: string;
  name: string;
  size: number;
  type: string;
};

export type Expense = {
  id: string;
  amount: number;
  incurredOn: string;
  category: ExpenseCategory;
  subcategory: string;
  notes: string;
  files: ExpenseFile[];
  createdAt: string;
};

export type ExpenseInput = {
  amount: number;
  incurredOn: string;
  category: ExpenseCategory;
  subcategory: string;
  notes?: string;
  files?: ExpenseFile[];
};
