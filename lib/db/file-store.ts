import { mkdirSync, readFileSync, writeFileSync, existsSync } from "fs";
import { dirname, join } from "path";
import { SEED_CATEGORIES, SEED_CUSTOMERS, SEED_ORDERS, SEED_PRODUCTS } from "@/lib/seed";
import { newId, shippingFor, slugify } from "@/lib/format";
import { hashPassword } from "@/lib/password";
import type {
  Category,
  Customer,
  CustomerInput,
  DashboardStats,
  NewsletterEntry,
  Order,
  OrderInput,
  OrderStatus,
  Product,
  ProductFilters,
  ProductInput,
  StoreData,
} from "@/types";

const FILE = join(process.cwd(), ".data", "store.json");

let cache: StoreData | null = null;

function initialStore(): StoreData {
  return {
    products: SEED_PRODUCTS,
    categories: SEED_CATEGORIES,
    orders: SEED_ORDERS,
    customers: SEED_CUSTOMERS,
    newsletter: [],
  };
}

function load(): StoreData {
  if (cache) return cache;
  if (existsSync(FILE)) {
    cache = JSON.parse(readFileSync(FILE, "utf8")) as StoreData;
  } else {
    cache = initialStore();
    persist();
  }
  return cache;
}

function persist() {
  if (!cache) return;
  mkdirSync(dirname(FILE), { recursive: true });
  writeFileSync(FILE, JSON.stringify(cache, null, 2));
}

function sortProducts(products: Product[], sort?: ProductFilters["sort"]) {
  const list = [...products];
  switch (sort) {
    case "price-asc":
      return list.sort((a, b) => a.price - b.price);
    case "price-desc":
      return list.sort((a, b) => b.price - a.price);
    case "name":
      return list.sort((a, b) => a.name.localeCompare(b.name));
    default:
      return list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }
}

function applyProductFilters(products: Product[], filters?: ProductFilters) {
  let list = products;
  if (filters?.status) list = list.filter((p) => p.status === filters.status);
  else list = list.filter((p) => p.status === "active");
  if (filters?.category && filters.category !== "all") {
    const slug = filters.category;
    list = list.filter(
      (p) => p.categorySlug === slug || (slug === "new-arrivals" && p.badge === "NEW"),
    );
  }
  if (filters?.q) {
    const q = filters.q.toLowerCase();
    list = list.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q),
    );
  }
  return sortProducts(list, filters?.sort);
}

export async function listProducts(filters?: ProductFilters): Promise<Product[]> {
  return applyProductFilters(load().products, filters);
}

export async function listAllProducts(): Promise<Product[]> {
  return [...load().products].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return load().products.find((p) => p.slug === slug) ?? null;
}

export async function getProductById(id: string): Promise<Product | null> {
  return load().products.find((p) => p.id === id) ?? null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const store = load();
  const product: Product = {
    id: newId("prod"),
    name: input.name,
    slug: input.slug || slugify(input.name),
    description: input.description,
    category: input.category,
    categorySlug: input.categorySlug,
    price: input.price,
    compareAtPrice: input.compareAtPrice ?? null,
    badge: input.badge ?? null,
    images: input.images.length ? input.images : ["https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=900&q=80"],
    sku: input.sku,
    sizes: input.sizes,
    colors: input.colors,
    stock: input.stock,
    status: input.status,
    createdAt: new Date().toISOString(),
  };
  store.products.unshift(product);
  persist();
  return product;
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
  const store = load();
  const index = store.products.findIndex((p) => p.id === id);
  if (index === -1) throw new Error("Product not found");
  const current = store.products[index];
  const updated: Product = {
    ...current,
    ...input,
    slug: input.slug || (input.name ? slugify(input.name) : current.slug),
    compareAtPrice: input.compareAtPrice === undefined ? current.compareAtPrice : input.compareAtPrice,
    badge: input.badge === undefined ? current.badge : input.badge,
  };
  store.products[index] = updated;
  persist();
  return updated;
}

export async function deleteProduct(id: string): Promise<void> {
  const store = load();
  store.products = store.products.filter((p) => p.id !== id);
  persist();
}

export async function listCategories(): Promise<Category[]> {
  return [...load().categories].sort((a, b) => a.sortOrder - b.sortOrder);
}

export async function upsertCategory(input: Omit<Category, "id"> & { id?: string }): Promise<Category> {
  const store = load();
  if (input.id) {
    const index = store.categories.findIndex((c) => c.id === input.id);
    if (index >= 0) {
      store.categories[index] = { ...store.categories[index], ...input, id: input.id };
      persist();
      return store.categories[index];
    }
  }
  const category: Category = {
    id: input.id || newId("cat"),
    name: input.name,
    slug: input.slug || slugify(input.name),
    subtitle: input.subtitle,
    image: input.image,
    sortOrder: input.sortOrder,
  };
  store.categories.push(category);
  persist();
  return category;
}

export async function deleteCategory(id: string): Promise<void> {
  const store = load();
  store.categories = store.categories.filter((c) => c.id !== id);
  persist();
}

export async function listOrders(): Promise<Order[]> {
  return [...load().orders].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getOrderById(id: string): Promise<Order | null> {
  return load().orders.find((o) => o.id === id || o.orderNumber === id) ?? null;
}

export async function listOrdersByCustomer(customerId: string, email?: string): Promise<Order[]> {
  return load()
    .orders.filter((o) => o.customerId === customerId || (email && o.email === email))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function createOrder(input: OrderInput): Promise<Order> {
  const store = load();
  const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = shippingFor(subtotal);
  const seq = 1000 + store.orders.length + 1;
  const order: Order = {
    id: newId("ord"),
    orderNumber: `VB-${seq}`,
    customerId: input.customerId ?? null,
    email: input.email,
    customerName: input.customerName,
    status: "pending",
    items: input.items,
    subtotal,
    shipping,
    total: subtotal + shipping,
    shippingAddress: input.shippingAddress,
    notes: input.notes ?? "",
    createdAt: new Date().toISOString(),
  };
  store.orders.unshift(order);
  for (const item of input.items) {
    const product = store.products.find((p) => p.id === item.productId);
    if (product) product.stock = Math.max(0, product.stock - item.quantity);
  }
  persist();
  return order;
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const store = load();
  const order = store.orders.find((o) => o.id === id);
  if (!order) throw new Error("Order not found");
  order.status = status;
  persist();
  return order;
}

export async function listCustomers(): Promise<Customer[]> {
  return [...load().customers].sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  return load().customers.find((c) => c.id === id) ?? null;
}

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  return load().customers.find((c) => c.email.toLowerCase() === email.toLowerCase()) ?? null;
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const store = load();
  if (store.customers.some((c) => c.email.toLowerCase() === input.email.toLowerCase())) {
    throw new Error("An account with this email already exists");
  }
  const customer: Customer = {
    id: newId("cust"),
    email: input.email.toLowerCase(),
    fullName: input.fullName,
    phone: input.phone ?? "",
    role: "customer",
    passwordHash: hashPassword(input.password),
    createdAt: new Date().toISOString(),
  };
  store.customers.unshift(customer);
  persist();
  return customer;
}

export async function addNewsletter(email: string): Promise<NewsletterEntry> {
  const store = load();
  const existing = store.newsletter.find((n) => n.email.toLowerCase() === email.toLowerCase());
  if (existing) return existing;
  const entry: NewsletterEntry = { id: newId("nl"), email, createdAt: new Date().toISOString() };
  store.newsletter.unshift(entry);
  persist();
  return entry;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const store = load();
  const paidLike = store.orders.filter((o) => o.status !== "cancelled");
  return {
    revenue: paidLike.reduce((sum, o) => sum + o.total, 0),
    orderCount: store.orders.length,
    productCount: store.products.length,
    customerCount: store.customers.length,
    pendingOrders: store.orders.filter((o) => o.status === "pending").length,
    lowStock: store.products.filter((p) => p.stock <= 10).length,
  };
}
