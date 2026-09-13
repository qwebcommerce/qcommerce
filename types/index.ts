export type ProductBadge = "NEW" | "SALE" | "BESTSELLER" | "TRENDING" | null;
export type ProductStatus = "active" | "draft";
export type OrderStatus =
  | "pending"
  | "paid"
  | "processing"
  | "shipped"
  | "delivered"
  | "cancelled";
export type UserRole = "customer" | "admin";

export type Category = {
  id: string;
  name: string;
  slug: string;
  subtitle: string;
  image: string;
  sortOrder: number;
};

export type Product = {
  id: string;
  name: string;
  slug: string;
  description: string;
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
  status: ProductStatus;
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
};

export type OrderItem = Omit<CartLine, "id">;

export type ShippingAddress = {
  line1: string;
  city: string;
  country: string;
  phone?: string;
};

export type Order = {
  id: string;
  orderNumber: string;
  customerId: string | null;
  email: string;
  customerName: string;
  status: OrderStatus;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  shippingAddress: ShippingAddress;
  notes: string;
  createdAt: string;
};

export type Customer = {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
};

export type NewsletterEntry = {
  id: string;
  email: string;
  createdAt: string;
};

export type StoreData = {
  products: Product[];
  categories: Category[];
  orders: Order[];
  customers: Customer[];
  newsletter: NewsletterEntry[];
};

export type ProductFilters = {
  category?: string;
  q?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "name";
  status?: ProductStatus;
};

export type ProductInput = {
  name: string;
  slug?: string;
  description: string;
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
  status: ProductStatus;
};

export type OrderInput = {
  customerId?: string | null;
  email: string;
  customerName: string;
  items: OrderItem[];
  notes?: string;
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
