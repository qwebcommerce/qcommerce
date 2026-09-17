import "server-only";
import { createAdminSupabase } from "@/lib/supabase/admin";
import { DEFAULT_STORE_SETTINGS, promoDiscount, promoIsActive, shippingFor, slugify, normalizePromo } from "@/lib/format";
import { hashPassword } from "@/lib/password";
import { slugsForCategory } from "@/lib/categories";
import { mapCategory, mapCustomer, mapExpense, mapOrder, mapProduct, productToRow } from "@/lib/db/mappers";
import { productIsLowStock } from "@/lib/products";
import { removeExpenseFile, removeStoredImage } from "@/lib/storage";
import type {
  Category,
  CategoryInput,
  Customer,
  CustomerInput,
  CustomerStatus,
  DashboardStats,
  Expense,
  ExpenseInput,
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

const STORE_SETTINGS_ID = "store";

function parseStoreSettings(row: {
  free_shipping_from?: unknown;
  shipping_fee?: unknown;
  return_days?: unknown;
  promo_code?: unknown;
  promo_percent?: unknown;
} | null): StoreSettings {
  const freeShippingFrom = Number(row?.free_shipping_from);
  const shippingFee = Number(row?.shipping_fee);
  const returnDays = Number(row?.return_days);
  const promoPercent = Number(row?.promo_percent);
  return {
    freeShippingFrom: Number.isFinite(freeShippingFrom) ? freeShippingFrom : DEFAULT_STORE_SETTINGS.freeShippingFrom,
    shippingFee: Number.isFinite(shippingFee) ? shippingFee : DEFAULT_STORE_SETTINGS.shippingFee,
    returnDays: Number.isFinite(returnDays) && returnDays > 0 ? returnDays : DEFAULT_STORE_SETTINGS.returnDays,
    promoCode: String(row?.promo_code ?? DEFAULT_STORE_SETTINGS.promoCode).trim(),
    promoPercent: Number.isFinite(promoPercent) ? promoPercent : DEFAULT_STORE_SETTINGS.promoPercent,
  };
}

function client() {
  const sb = createAdminSupabase();
  if (!sb) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.");
  return sb;
}

export async function listProducts(filters?: ProductFilters): Promise<Product[]> {
  const sb = client();
  let query = sb.from("products").select("*");
  if (filters?.status) query = query.eq("status", filters.status);
  else query = query.eq("status", "active");
  if (filters?.category && filters.category !== "all") {
    if (filters.category === "new-arrivals") query = query.eq("badge", "NEW");
    else {
      const { data: categoryRows, error: categoryError } = await sb.from("categories").select("*");
      if (categoryError) throw categoryError;
      const slugs = slugsForCategory((categoryRows ?? []).map(mapCategory), filters.category);
      query = slugs.length === 1 ? query.eq("category_slug", slugs[0]) : query.in("category_slug", slugs);
    }
  }
  if (filters?.q) {
    const q = filters.q.replace(/[%_,]/g, " ").trim();
    if (q) {
      query = query.or(
        `name.ilike.%${q}%,name_ar.ilike.%${q}%,sku.ilike.%${q}%,category.ilike.%${q}%,slug.ilike.%${q}%`,
      );
    }
  }
  if (filters?.sort === "price-asc") query = query.order("price", { ascending: true });
  else if (filters?.sort === "price-desc") query = query.order("price", { ascending: false });
  else if (filters?.sort === "name") query = query.order("name", { ascending: true });
  else query = query.order("created_at", { ascending: false });
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function listAllProducts(): Promise<Product[]> {
  const sb = client();
  const { data, error } = await sb.from("products").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapProduct);
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const sb = client();
  const { data, error } = await sb.from("products").select("*").eq("slug", slug).maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : null;
}

export async function getProductById(id: string): Promise<Product | null> {
  const sb = client();
  const { data, error } = await sb.from("products").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data) : null;
}

export async function createProduct(input: ProductInput): Promise<Product> {
  const sb = client();
  const row = productToRow({
    ...input,
    nameAr: input.nameAr ?? "",
    descriptionAr: input.descriptionAr ?? "",
    slug: input.slug || slugify(input.name),
    compareAtPrice: input.compareAtPrice ?? null,
    badge: input.badge ?? null,
    hasVariants: input.hasVariants ?? false,
    variants: input.variants ?? [],
  });
  const { data, error } = await sb.from("products").insert(row).select("*").single();
  if (error) throw error;
  return mapProduct(data);
}

export async function updateProduct(id: string, input: Partial<ProductInput>): Promise<Product> {
  const sb = client();
  const patch: Record<string, unknown> = {};
  if (input.name !== undefined) patch.name = input.name;
  if (input.nameAr !== undefined) patch.name_ar = input.nameAr;
  if (input.slug !== undefined) patch.slug = input.slug;
  else if (input.name) patch.slug = slugify(input.name);
  if (input.description !== undefined) patch.description = input.description;
  if (input.descriptionAr !== undefined) patch.description_ar = input.descriptionAr;
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
  if (input.hasVariants !== undefined) patch.has_variants = input.hasVariants;
  if (input.variants !== undefined) patch.variants = input.variants;
  if (input.status !== undefined) patch.status = input.status;
  const { data, error } = await sb.from("products").update(patch).eq("id", id).select("*").single();
  if (error) throw error;
  return mapProduct(data);
}

export async function deleteProduct(id: string): Promise<void> {
  const sb = client();
  const previous = await getProductById(id);
  if (previous) {
    for (const image of previous.images) await removeStoredImage(image);
    for (const variant of previous.variants) await removeStoredImage(variant.image);
  }
  const { error } = await sb.from("products").delete().eq("id", id);
  if (error) throw error;
}

export async function listCategories(): Promise<Category[]> {
  const sb = client();
  const { data, error } = await sb.from("categories").select("*").order("sort_order").order("name");
  if (error) throw error;
  return (data ?? []).map(mapCategory);
}

export async function getCategoryById(id: string): Promise<Category | null> {
  const sb = client();
  const { data, error } = await sb.from("categories").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapCategory(data) : null;
}

function categoryWriteError(error: { code?: string; message?: string }) {
  if (error.code === "23505") return new Error("A category with this slug already exists.");
  return new Error(error.message || "Could not save category.");
}

export async function upsertCategory(input: CategoryInput): Promise<Category> {
  const sb = client();
  const name = input.name.trim();
  const slug = (input.slug || slugify(name)).trim();
  if (!name) throw new Error("Name is required.");
  if (!slug) throw new Error("Add a URL slug.");

  const parentId = input.parentId || null;
  if (parentId) {
    const parent = await getCategoryById(parentId);
    if (!parent) throw new Error("Parent category was not found.");
    if (parent.parentId) throw new Error("Subcategories cannot have their own subcategories.");
    if (input.id) {
      const { data: children } = await sb.from("categories").select("id").eq("parent_id", input.id).limit(1);
      if (children?.length) throw new Error("Move or delete subcategories before nesting this category.");
    }
  }

  const row = {
    name,
    name_ar: input.nameAr?.trim() ?? "",
    slug,
    subtitle: input.subtitle?.trim() ?? "",
    subtitle_ar: input.subtitleAr?.trim() ?? "",
    image: input.image?.trim() ?? "",
    sort_order: input.sortOrder ?? 0,
    parent_id: parentId,
  };

  const previous = input.id ? await getCategoryById(input.id) : null;
  const query = input.id
    ? sb.from("categories").update(row).eq("id", input.id)
    : sb.from("categories").insert(row);
  const { data, error } = await query.select("*").single();
  if (error) throw categoryWriteError(error);

  const saved = mapCategory(data);
  if (previous && (previous.slug !== saved.slug || previous.name !== saved.name)) {
    const patch: Record<string, string> = { category: saved.name };
    if (previous.slug !== saved.slug) patch.category_slug = saved.slug;
    const { error: productError } = await sb.from("products").update(patch).eq("category_slug", previous.slug);
    if (productError) throw productError;
  }
  return saved;
}

export async function deleteCategory(id: string): Promise<void> {
  const sb = client();
  const category = await getCategoryById(id);
  if (!category) throw new Error("Category was not found.");

  const { data: children } = await sb.from("categories").select("id").eq("parent_id", id).limit(1);
  if (children?.length) throw new Error("Delete or move subcategories first.");

  const { data: products } = await sb.from("products").select("id").eq("category_slug", category.slug).limit(1);
  if (products?.length) throw new Error("Reassign products in this category before deleting it.");

  await removeStoredImage(category.image);

  const { error } = await sb.from("categories").delete().eq("id", id);
  if (error) throw error;
}

export async function listOrders(): Promise<Order[]> {
  const sb = client();
  const { data, error } = await sb.from("orders").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

export async function getOrderById(id: string): Promise<Order | null> {
  const sb = client();
  const key = id.trim();
  if (!key) return null;
  const uuidLike = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(key);
  const query = uuidLike
    ? sb.from("orders").select("*").eq("id", key)
    : sb.from("orders").select("*").eq("order_number", key);
  const { data, error } = await query.maybeSingle();
  if (error) throw error;
  return data ? mapOrder(data) : null;
}

export async function listOrdersByCustomer(customerId: string, email?: string): Promise<Order[]> {
  const sb = client();
  let query = sb.from("orders").select("*").order("created_at", { ascending: false });
  query = email ? query.or(`customer_id.eq.${customerId},email.eq.${email}`) : query.eq("customer_id", customerId);
  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []).map(mapOrder);
}

export async function getStoreSettings(): Promise<StoreSettings> {
  try {
    const sb = client();
    const { data, error } = await sb.from("store_settings").select("*").eq("id", STORE_SETTINGS_ID).maybeSingle();
    if (error || !data) return DEFAULT_STORE_SETTINGS;
    return parseStoreSettings(data);
  } catch {
    return DEFAULT_STORE_SETTINGS;
  }
}

export async function updateStoreSettings(input: StoreSettings): Promise<StoreSettings> {
  const sb = client();
  const { data, error } = await sb
    .from("store_settings")
    .upsert(
      {
        id: STORE_SETTINGS_ID,
        free_shipping_from: input.freeShippingFrom,
        shipping_fee: input.shippingFee,
        return_days: input.returnDays,
        promo_code: input.promoCode,
        promo_percent: input.promoPercent,
        updated_at: new Date().toISOString(),
      },
      { onConflict: "id" },
    )
    .select("*")
    .single();
  if (error) throw error;
  return parseStoreSettings(data);
}

export async function emailHasUsedPromo(email: string, code: string): Promise<boolean> {
  const normalizedEmail = email.trim().toLowerCase();
  const promo = normalizePromo(code);
  if (!normalizedEmail || !promo) return false;
  try {
    const sb = client();
    const { data, error } = await sb.from("orders").select("email, shipping_address").ilike("email", normalizedEmail);
    if (error || !data) return false;
    return data.some((row) => {
      const address = row.shipping_address as { promoCode?: string } | null;
      return normalizePromo(String(address?.promoCode ?? "")) === promo;
    });
  } catch {
    return false;
  }
}

export async function createOrder(input: OrderInput): Promise<Order> {
  const sb = client();
  const settings = await getStoreSettings();
  const subtotal = input.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const shipping = shippingFor(subtotal, settings);
  const requested = normalizePromo(input.promoCode ?? "");
  let discount = 0;
  let appliedPromo = "";
  if (requested) {
    if (!promoIsActive(settings) || requested !== normalizePromo(settings.promoCode)) {
      throw new Error("Invalid promo code");
    }
    if (await emailHasUsedPromo(input.email, settings.promoCode)) {
      throw new Error("This email has already used this promo code");
    }
    discount = promoDiscount(subtotal, settings.promoPercent);
    appliedPromo = normalizePromo(settings.promoCode);
  }
  const { count } = await sb.from("orders").select("*", { count: "exact", head: true });
  const row = {
    order_number: `VB-${1000 + (count ?? 0) + 1}`,
    customer_id: input.customerId ?? null,
    email: input.email,
    customer_name: input.customerName,
    status: "pending",
    payment_status: "unpaid",
    items: input.items,
    subtotal,
    shipping,
    total: Math.max(0, subtotal - discount + shipping),
    shipping_address: {
      line1: input.shippingAddress.line1,
      city: input.shippingAddress.city,
      country: input.shippingAddress.country,
      phone: input.shippingAddress.phone ?? "",
      paymentMethod: input.paymentMethod ?? input.shippingAddress.paymentMethod ?? "cod",
      promoCode: appliedPromo,
      discount,
      promoPercent: appliedPromo ? settings.promoPercent : 0,
      isGuest: !input.customerId,
    },
    notes: input.notes ?? "",
  };
  const { data, error } = await sb.from("orders").insert(row).select("*").single();
  if (error) throw error;
  for (const item of input.items) {
    const { data: product } = await sb
      .from("products")
      .select("stock, has_variants, variants")
      .eq("id", item.productId)
      .maybeSingle();
    if (!product) continue;
    if (product.has_variants && item.variantId) {
      const variants = (Array.isArray(product.variants) ? product.variants : []).map((variant: { id?: string; stock?: number }) =>
        variant.id === item.variantId
          ? { ...variant, stock: Math.max(0, Number(variant.stock ?? 0) - item.quantity) }
          : variant,
      );
      const stock = variants.reduce((sum: number, variant: { stock?: number }) => sum + Number(variant.stock ?? 0), 0);
      await sb.from("products").update({ variants, stock }).eq("id", item.productId);
    } else {
      await sb.from("products").update({ stock: Math.max(0, product.stock - item.quantity) }).eq("id", item.productId);
    }
  }
  return mapOrder(data);
}

export async function updateOrder(
  id: string,
  patch: { status?: OrderStatus; paymentStatus?: PaymentStatus },
): Promise<Order> {
  const sb = client();
  const row: Record<string, string> = {};
  if (patch.status) row.status = patch.status;
  if (patch.paymentStatus) row.payment_status = patch.paymentStatus;
  if (!Object.keys(row).length) {
    const current = await getOrderById(id);
    if (!current) throw new Error("Order not found");
    return current;
  }
  const { data, error } = await sb.from("orders").update(row).eq("id", id).select("*").single();
  if (error) throw error;
  return mapOrder(data);
}

export async function updateOrderStatus(id: string, status: OrderStatus): Promise<Order> {
  return updateOrder(id, { status });
}

export async function listCustomers(): Promise<Customer[]> {
  const sb = client();
  const { data, error } = await sb.from("customers").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapCustomer);
}

export async function getCustomerById(id: string): Promise<Customer | null> {
  const sb = client();
  const { data, error } = await sb.from("customers").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapCustomer(data) : null;
}

export async function getCustomerByEmail(email: string): Promise<Customer | null> {
  const sb = client();
  const { data, error } = await sb.from("customers").select("*").ilike("email", email).maybeSingle();
  if (error) throw error;
  return data ? mapCustomer(data) : null;
}

export async function createCustomer(input: CustomerInput): Promise<Customer> {
  const sb = client();
  const { data, error } = await sb
    .from("customers")
    .insert({
      email: input.email.toLowerCase(),
      full_name: input.fullName,
      phone: input.phone ?? "",
      role: "customer",
      status: "active",
      password_hash: hashPassword(input.password),
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapCustomer(data);
}

export async function updateCustomer(
  id: string,
  input: { fullName?: string; phone?: string; status?: CustomerStatus },
): Promise<Customer> {
  const sb = client();
  const row: Record<string, string> = {};
  if (input.fullName !== undefined) row.full_name = input.fullName;
  if (input.phone !== undefined) row.phone = input.phone;
  if (input.status !== undefined) row.status = input.status;
  const { data, error } = await sb.from("customers").update(row).eq("id", id).select("*").single();
  if (error) throw error;
  return mapCustomer(data);
}

export async function addNewsletter(email: string): Promise<NewsletterEntry> {
  const sb = client();
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
    lowStock: products.filter((p) => productIsLowStock(p)).length,
  };
}

export async function listExpenses(): Promise<Expense[]> {
  const sb = client();
  const { data, error } = await sb.from("expenses").select("*").order("incurred_on", { ascending: false }).order("created_at", { ascending: false });
  if (error) throw error;
  return (data ?? []).map(mapExpense);
}

export async function getExpenseById(id: string): Promise<Expense | null> {
  const sb = client();
  const { data, error } = await sb.from("expenses").select("*").eq("id", id).maybeSingle();
  if (error) throw error;
  return data ? mapExpense(data) : null;
}

export async function createExpense(input: ExpenseInput): Promise<Expense> {
  const sb = client();
  const { data, error } = await sb
    .from("expenses")
    .insert({
      amount: input.amount,
      incurred_on: input.incurredOn,
      category: input.category,
      subcategory: input.subcategory,
      notes: input.notes ?? "",
      files: input.files ?? [],
    })
    .select("*")
    .single();
  if (error) throw error;
  return mapExpense(data);
}

export async function updateExpense(id: string, input: ExpenseInput): Promise<Expense> {
  const sb = client();
  const previous = await getExpenseById(id);
  const { data, error } = await sb
    .from("expenses")
    .update({
      amount: input.amount,
      incurred_on: input.incurredOn,
      category: input.category,
      subcategory: input.subcategory,
      notes: input.notes ?? "",
      files: input.files ?? [],
    })
    .eq("id", id)
    .select("*")
    .single();
  if (error) throw error;
  const next = mapExpense(data);
  const keep = new Set(next.files.map((file) => file.path));
  if (previous) {
    for (const file of previous.files) {
      if (!keep.has(file.path)) await removeExpenseFile(file.path);
    }
  }
  return next;
}

export async function deleteExpense(id: string): Promise<void> {
  const previous = await getExpenseById(id);
  const sb = client();
  const { error } = await sb.from("expenses").delete().eq("id", id);
  if (error) throw error;
  if (previous) {
    for (const file of previous.files) await removeExpenseFile(file.path);
  }
}
