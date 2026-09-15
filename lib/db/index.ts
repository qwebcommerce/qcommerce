import "server-only";
import * as supabaseStore from "@/lib/db/supabase-store";
import type {
  Category,
  CategoryInput,
  Customer,
  CustomerInput,
  CustomerStatus,
  DashboardStats,
  NewsletterEntry,
  Order,
  OrderInput,
  OrderStatus,
  PaymentStatus,
  Product,
  ProductFilters,
  ProductInput,
  StoreSettings,
} from "@/types";

export async function listProducts(filters?: ProductFilters): Promise<Product[]> {
  return supabaseStore.listProducts(filters);
}

export async function listAllProducts(): Promise<Product[]> {
  return supabaseStore.listAllProducts();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return supabaseStore.getProductBySlug(slug);
}

export async function getProductById(id: string): Promise<Product | null> {
  return supabaseStore.getProductById(id);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  return supabaseStore.createProduct(input);
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
  return supabaseStore.updateProduct(id, input);
}

export async function deleteProduct(id: string): Promise<void> {
  return supabaseStore.deleteProduct(id);
}

export async function listCategories(): Promise<Category[]> {
  return supabaseStore.listCategories();
}

export async function getCategoryById(id: string): Promise<Category | null> {
  return supabaseStore.getCategoryById(id);
}

export async function upsertCategory(input: CategoryInput): Promise<Category> {
  return supabaseStore.upsertCategory(input);
}

export async function deleteCategory(id: string): Promise<void> {
  return supabaseStore.deleteCategory(id);
}

export async function listOrders(): Promise<Order[]> {
  return supabaseStore.listOrders();
}

export async function getOrderById(id: string): Promise<Order | null> {
  return supabaseStore.getOrderById(id);
}

export async function listOrdersByCustomer(customerId: string, email?: string): Promise<Order[]> {
  return supabaseStore.listOrdersByCustomer(customerId, email);
}

export async function createOrder(input: OrderInput): Promise<Order> {
  return supabaseStore.createOrder(input);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return supabaseStore.updateOrder(id, { status });
}

export async function updateOrderPaymentStatus(id: string, paymentStatus: PaymentStatus): Promise<Order> {
  return supabaseStore.updateOrder(id, { paymentStatus });
}

export async function updateOrder(
  id: string,
  patch: { status?: OrderStatus; paymentStatus?: PaymentStatus },
): Promise<Order> {
  return supabaseStore.updateOrder(id, patch);
}

export async function listCustomers(): Promise<Customer[]> {
  return supabaseStore.listCustomers();
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  return supabaseStore.getCustomerById(id);
}

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  return supabaseStore.getCustomerByEmail(email);
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  return supabaseStore.createCustomer(input);
}

export async function updateCustomer(
  id: string,
  input: { fullName?: string; phone?: string; status?: CustomerStatus },
): Promise<Customer> {
  return supabaseStore.updateCustomer(id, input);
}

export async function addNewsletter(email: string): Promise<NewsletterEntry> {
  return supabaseStore.addNewsletter(email);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return supabaseStore.getDashboardStats();
}

export async function getStoreSettings(): Promise<StoreSettings> {
  return supabaseStore.getStoreSettings();
}

export async function updateStoreSettings(input: StoreSettings): Promise<StoreSettings> {
  return supabaseStore.updateStoreSettings(input);
}

export async function emailHasUsedPromo(email: string, code: string): Promise<boolean> {
  return supabaseStore.emailHasUsedPromo(email, code);
}
