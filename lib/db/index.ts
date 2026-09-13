import { isSupabaseConfigured } from "@/lib/supabase/env";
import * as fileStore from "@/lib/db/file-store";
import * as supabaseStore from "@/lib/db/supabase-store";
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
} from "@/types";

function store() {
  return isSupabaseConfigured() ? supabaseStore : fileStore;
}

export async function listProducts(filters?: ProductFilters): Promise<Product[]> {
  return store().listProducts(filters);
}

export async function listAllProducts(): Promise<Product[]> {
  return store().listAllProducts();
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  return store().getProductBySlug(slug);
}

export async function getProductById(id: string): Promise<Product | null> {
  return store().getProductById(id);
}

export async function createProduct(input: ProductInput): Promise<Product> {
  return store().createProduct(input);
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
  return store().updateProduct(id, input);
}

export async function deleteProduct(id: string): Promise<void> {
  return store().deleteProduct(id);
}

export async function listCategories(): Promise<Category[]> {
  return store().listCategories();
}

export async function upsertCategory(input: Omit<Category, "id"> & { id?: string }): Promise<Category> {
  return store().upsertCategory(input);
}

export async function deleteCategory(id: string): Promise<void> {
  return store().deleteCategory(id);
}

export async function listOrders(): Promise<Order[]> {
  return store().listOrders();
}

export async function getOrderById(id: string): Promise<Order | null> {
  return store().getOrderById(id);
}

export async function listOrdersByCustomer(customerId: string, email?: string): Promise<Order[]> {
  return store().listOrdersByCustomer(customerId, email);
}

export async function createOrder(input: OrderInput): Promise<Order> {
  return store().createOrder(input);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return store().updateOrderStatus(id, status);
}

export async function listCustomers(): Promise<Customer[]> {
  return store().listCustomers();
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  return store().getCustomerById(id);
}

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  return store().getCustomerByEmail(email);
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  return store().createCustomer(input);
}

export async function addNewsletter(email: string): Promise<NewsletterEntry> {
  return store().addNewsletter(email);
}

export async function getDashboardStats(): Promise<DashboardStats> {
  return store().getDashboardStats();
}
