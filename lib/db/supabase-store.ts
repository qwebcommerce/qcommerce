import { createAdminSupabase } from "@/lib/supabase/admin";
import { createServerSupabase } from "@/lib/supabase/server";
import { newId, shippingFor, slugify } from "@/lib/format";
import { hashPassword } from "@/lib/password";
import { mapCategory, mapCustomer, mapOrder, mapProduct, productToRow } from "@/lib/db/mappers";
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

async function client() {
  return createAdminSupabase() ?? (await createServerSupabase());
}

function fail(): never {
  throw new Error("Supabase is not configured");
}

export async function listProducts(filters?: ProductFilters): Promise<Product[]> {
  const sb = await client();
  if (!sb) fail();
  let query = sb.from("products").select("*");
  if (filters?.status) query = query.eq("status", filters.status);
  else query = query.eq("status", "active");
  if (filters?.category && filters.category !== "all") {
    if (filters.category === "new-arrivals") query = query.eq("badge", "NEW");
    else query = query.eq("category_slug", filters.category);
  }
  if (filters?.q) query = query.or(`name.ilike.%${filters.q}%,sku.ilike.%${filters.q}%,category.ilike.%${filters.q}%`);
  if (filters?.sort === "price-asc") query = query.order("price", { ascending: true });
  else if (filters?.sort === "price-desc") query = query.order("price", { ascending: false });
  else if (filters?.sort === "name") query = query.order("name", { ascending: true });
  else query = query.order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function listAllProducts(): Promise<Product[]> {
  const sb = await client();
  if (!sb) fail();
  const { data, error } = await sb.from("products").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const sb = await client();
  if (!sb) fail();
  const { data, error } = await sb.from("products").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const sb = await client();
  if (!sb) fail();
  const { data, error } = await sb.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const sb = await client();
  if (!sb) fail();
  const row = {
    ...productToRow({
      ...input,
      slug: input.slug || slugify(input.name),
      compareAtPrice: input.compareAtPrice ?? null,
      badge: input.badge ?? null,
    }),
  };
  const { data, error } = await sb.from("products").insert(row).select("*").single();
  if (error) throw error;
  return mapProduct(data);
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
  const sb = await client();
  if (!sb) fail();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.slug !== undefined) patch.slug = input.slug;
  else if (input.name) patch.slug = slugify(input.name);
  if (input.description !== undefined) patch.description = input.description;
  if (input.category !== undefined) patch.category = input.category;
  if (input.categorySlug !== undefined) patch.category_slug = input.categorySlug;
  if (input.price !== undefined) patch.price = input.price;
  if (input.compareAtPrice !== undefined) patch.compare_at_price = input.compareAtPrice;
  if (input.badge !== undefined) patch.badge = input.badge;
  if (input.images !== undefined) patch.images = input.images;
  if (input.sku !== undefined) patch.sku = input.sku;
  if (input.sizes !== undefined) patch.sizes = input.sizes;
  if (input.colors !== undefined) patch.colors = input.colors;
  if (input.stock !== undefined) patch.stock = input.stock;
  if (input.status !== undefined) patch.status = input.status;
  const { data, error } = await sb.from("products").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return mapProduct(data);
}

export async function deleteProduct(id: string): Promise<void> {
  const sb = await client();
  if (!sb) fail();
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function listCategories(): Promise<Category[]> {
  const sb = await client();
  if (!sb) fail();
  const { data, error } = await sb.from("categories").select("*").order("sort_order");
  if (error) throw error;
  return (data ?? []).map(mapCategory);
}

export async function upsertCategory(input: Omit<Category, "id"> & { id?: string }): Promise<Category> {
  const sb = await client();
  if (!sb) fail();
  const row = {
    id: input.id,
    name: input.name,
    slug: input.slug || slugify(input.name),
    subtitle: input.subtitle,
    image: input.image,
    sort_order: input.sortOrder,
  };
  const { data, error } = await sb.from("categories").upsert(row).select("*").single();
  if (error) throw error;
  return mapCategory(data);
}

export async function deleteCategory(id: string): Promise<void> {
  const sb = await client();
  if (!sb) fail();
  const { error } = await sb.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function listOrders(): Promise<Order[]> {
  const sb = await client();
  if (!sb) fail();
  const { data, error } = await sb.from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

export async function getOrderById(id: string): Promise<Order | null> {
  const sb = await client();
  if (!sb) fail();
  const { data, error } = await sb.from("orders").select("*").or(`id.eq.${id},order_number.eq.${id}`).maybeSingle();
  if (error) throw error;
  return data ? mapOrder(data) : null;
}

export async function listOrdersByCustomer(customerId: string, email?: string): Promise<Order[]> {
  const sb = await client();
  if (!sb) fail();
  let query = sb.from("orders").select("*").order("created_at", { ascending: false });
  query = email ? query.or(`customer_id.eq.${customerId},email.eq.${email}`) : query.eq("customer_id", customerId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

export async function createOrder(input: OrderInput): Promise<Order> {
  const sb = await client();
  if (!sb) fail();
  const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = shippingFor(subtotal);
  const { count } = await sb.from("orders").select("*", { count: "exact", head: true });
  const row = {
    order_number: `VB-${1000 + (count ?? 0) + 1}`,
    customer_id: input.customerId ?? null,
    email: input.email,
    customer_name: input.customerName,
    status: "pending",
    items: input.items,
    subtotal,
    shipping,
    total: subtotal + shipping,
    shipping_address: input.shippingAddress,
    notes: input.notes ?? "",
  };
  const { data, error } = await sb.from("orders").insert(row).select("*").single();
  if (error) throw error;
  for (const item of input.items) {
    const { data: product } = await sb.from("products").select("stock").eq("id", item.productId).maybeSingle();
    if (product) {
      await sb.from("products").update({ stock: Math.max(0, product.stock - item.quantity) }).eq("id", item.productId);
    }
  }
  return mapOrder(data);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  const sb = await client();
  if (!sb) fail();
  const { data, error } = await sb.from("orders").update({ status }).eq("id", id).select("*").single();
  if (error) throw error;
  return mapOrder(data);
}

export async function listCustomers(): Promise<Customer[]> {
  const sb = await client();
  if (!sb) fail();
  const { data, error } = await sb.from("customers").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapCustomer);
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const sb = await client();
  if (!sb) fail();
  const { data, error } = await sb.from("customers").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapCustomer(data) : null;
}

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const sb = await client();
  if (!sb) fail();
  const { data, error } = await sb.from("customers").select("*").ilike("email", email).maybeSingle();
  if (error) throw error;
  return data ? mapCustomer(data) : null;
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const sb = await client();
  if (!sb) fail();
  const { data, error } = await sb
    .from("customers")
    .insert({
      email: input.email.toLowerCase(),
      full_name: input.fullName,
      phone: input.phone ?? "",
      role: "customer",
      password_hash: hashPassword(input.password),
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapCustomer(data);
}

export async function addNewsletter(email: string): Promise<NewsletterEntry> {
  const sb = await client();
  if (!sb) fail();
  const { data, error } = await sb.from("newsletter").upsert({ email }).select("*").single();
  if (error) throw error;
  return { id: data.id, email: data.email, createdAt: data.created_at };
}

export async function getDashboardStats(): Promise<DashboardStats> {
  const [products, orders, customers] = await Promise.all([listAllProducts(), listOrders(), listCustomers()]);
  const paidLike = orders.filter((o) => o.status !== "cancelled");
  return {
    revenue: paidLike.reduce((sum, o) => sum + o.total, 0),
    orderCount: orders.length,
    productCount: products.length,
    customerCount: customers.length,
    pendingOrders: orders.filter((o) => o.status === "pending").length,
    lowStock: products.filter((p) => p.stock <= 10).length,
  };
}

export { newId };
