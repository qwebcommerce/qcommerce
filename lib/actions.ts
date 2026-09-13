"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addNewsletter,
  createCustomer,
  createOrder,
  createProduct,
  deleteCategory,
  deleteProduct,
  updateOrderStatus,
  updateProduct,
  upsertCategory,
} from "@/lib/db";
import {
  adminCredentials,
  authenticateCustomer,
  clearAdminSession,
  clearCustomerSession,
  getCustomerSession,
  requireAdmin,
  setAdminSession,
  setCustomerSession,
} from "@/lib/auth";
import type { OrderItem, OrderStatus, ProductBadge, ProductInput, ProductStatus } from "@/types";

function formString(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function csv(value: string) {
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

export async function loginAdminAction(formData: FormData) {
  const { email, password } = adminCredentials();
  const givenEmail = formString(formData, "email");
  const givenPassword = formString(formData, "password");
  if (givenEmail !== email || givenPassword !== password) {
    return { error: "Invalid admin credentials" };
  }
  await setAdminSession(givenEmail);
  redirect("/admin");
}

export async function logoutAdminAction() {
  await clearAdminSession();
  redirect("/admin/login");
}

export async function registerCustomerAction(formData: FormData) {
  try {
    const customer = await createCustomer({
      email: formString(formData, "email"),
      fullName: formString(formData, "fullName"),
      phone: formString(formData, "phone"),
      password: formString(formData, "password"),
    });
    await setCustomerSession({ id: customer.id, email: customer.email, fullName: customer.fullName });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create account" };
  }
  redirect("/account");
}

export async function loginCustomerAction(formData: FormData) {
  try {
    const customer = await authenticateCustomer(formString(formData, "email"), formString(formData, "password"));
    await setCustomerSession({ id: customer.id, email: customer.email, fullName: customer.fullName });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not sign in" };
  }
  redirect("/account");
}

export async function logoutCustomerAction() {
  await clearCustomerSession();
  redirect("/");
}

export async function subscribeNewsletterAction(formData: FormData) {
  const email = formString(formData, "email");
  if (!email) return { error: "Email is required" };
  await addNewsletter(email);
  return { ok: true };
}

export async function placeOrderAction(input: {
  email: string;
  customerName: string;
  items: OrderItem[];
  notes?: string;
  shippingAddress: {
    line1: string;
    city: string;
    country: string;
    phone?: string;
  };
}) {
  if (!input.items.length) return { error: "Your bag is empty" };
  const session = await getCustomerSession();
  const order = await createOrder({
    ...input,
    customerId: session?.id ?? null,
    email: input.email || session?.email || "",
    customerName: input.customerName || session?.fullName || "Guest",
  });
  revalidatePath("/admin");
  revalidatePath("/account");
  return { ok: true, orderId: order.id, orderNumber: order.orderNumber };
}

export async function saveProductAction(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "id");
  const payload: ProductInput = {
    name: formString(formData, "name"),
    slug: formString(formData, "slug") || undefined,
    description: formString(formData, "description"),
    category: formString(formData, "category"),
    categorySlug: formString(formData, "categorySlug"),
    price: Number(formString(formData, "price") || 0),
    compareAtPrice: formString(formData, "compareAtPrice") ? Number(formString(formData, "compareAtPrice")) : null,
    badge: (formString(formData, "badge") || null) as ProductBadge,
    images: csv(formString(formData, "images")),
    sku: formString(formData, "sku"),
    sizes: csv(formString(formData, "sizes")),
    colors: csv(formString(formData, "colors")),
    stock: Number(formString(formData, "stock") || 0),
    status: (formString(formData, "status") || "active") as ProductStatus,
  };
  if (id) await updateProduct(id, payload);
  else await createProduct(payload);
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  await deleteProduct(formString(formData, "id"));
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  redirect("/admin/products");
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "id");
  const status = formString(formData, "status") as OrderStatus;
  await updateOrderStatus(id, status);
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/account");
}

export async function saveCategoryAction(formData: FormData) {
  await requireAdmin();
  await upsertCategory({
    id: formString(formData, "id") || undefined,
    name: formString(formData, "name"),
    slug: formString(formData, "slug"),
    subtitle: formString(formData, "subtitle"),
    image: formString(formData, "image"),
    sortOrder: Number(formString(formData, "sortOrder") || 0),
  });
  revalidatePath("/admin/categories");
  revalidatePath("/");
  revalidatePath("/shop");
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  await deleteCategory(formString(formData, "id"));
  revalidatePath("/admin/categories");
}
