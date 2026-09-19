"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import {
  addNewsletter,
  createCustomer,
  createExpense,
  createOrder,
  createProduct,
  deleteCategory,
  deleteExpense,
  deleteProduct,
  emailHasUsedPromo,
  getCategoryById,
  getCustomerById,
  getOrderById,
  getProductById,
  getStoreSettings,
  listAllProducts,
  listCategories,
  updateCustomer,
  updateExpense,
  updateOrder,
  updateProduct,
  updateStoreSettings,
  upsertCategory,
} from "@/lib/db";
import {
  adminCredentials,
  authenticateCustomer,
  clearAdminSession,
  clearCustomerSession,
  getCustomerSession,
  requireAdmin,
  safeNextPath,
  setAdminSession,
  setCustomerSession,
} from "@/lib/auth";
import { mapVariants } from "@/lib/db/mappers";
import { notifyOrderCreated, notifyOrderReadyToShip, shouldSendReadyToShip } from "@/lib/email/orders";
import { isValidExpensePair, MAX_EXPENSE_FILES, todayIsoDate } from "@/lib/expenses";
import { normalizePromo, promoIsActive } from "@/lib/format";
import {
  applyShipmentAttempt,
  canManualRetry,
  DROPSHIP_UI_ENABLED,
  isDropshipSource,
  isListedOnShop,
  normalizeProductSource,
  parseSupplierUrl,
  placeSupplierOrder,
  sellableStock,
} from "@/lib/dropship";
import { productStock } from "@/lib/products";
import { importRowToInput, validateProductImport } from "@/lib/product-import";
import { removeExpenseFile, removeStoredImage, uploadCategoryImage, uploadExpenseFile } from "@/lib/storage";
import { composeGulfPhone, isValidEmail, parseGulfPhone } from "@/lib/validation";
import type {
  CustomerStatus,
  DropshipShipment,
  ExpenseFile,
  Order,
  OrderItem,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
  ProductBadge,
  ProductInput,
  ProductStatus,
  ProductVariant,
} from "@/types";
import { ORDER_STATUSES } from "@/types";

function formString(form: FormData, key: string) {
  return String(form.get(key) ?? "").trim();
}

function csv(value: string) {
  return value.split(",").map((v) => v.trim()).filter(Boolean);
}

async function fulfillDropshipShipments(
  order: Order,
  options: { shipmentId?: string } = {},
): Promise<Order> {
  const settings = await getStoreSettings();
  const shipments = order.shipments ?? [];
  if (!shipments.length) return order;

  let changed = false;
  const next: DropshipShipment[] = [];
  for (const shipment of shipments) {
    const targeted = !options.shipmentId || shipment.id === options.shipmentId;
    if (!targeted || !canManualRetry(shipment)) {
      next.push(shipment);
      continue;
    }
    const result = await placeSupplierOrder({
      enabled: settings.dropshipEnabled,
      source: shipment.source,
      supplierProductId: shipment.supplierProductId,
      quantity: shipment.quantity,
      address: order.shippingAddress,
    });
    next.push(applyShipmentAttempt(shipment, result));
    changed = true;
  }
  if (!changed) return order;
  return updateOrder(order.id, { shipments: next });
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
      password: formString(formData, "password"),
    });
    await setCustomerSession({ id: customer.id, email: customer.email, fullName: customer.fullName });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not create account" };
  }
  redirect(safeNextPath(formString(formData, "next")));
}

export async function loginCustomerAction(formData: FormData) {
  try {
    const customer = await authenticateCustomer(formString(formData, "email"), formString(formData, "password"));
    await setCustomerSession({ id: customer.id, email: customer.email, fullName: customer.fullName });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not sign in" };
  }
  redirect(safeNextPath(formString(formData, "next")));
}

export async function logoutCustomerAction() {
  await clearCustomerSession();
  redirect("/");
}

export async function updateCustomerProfileAction(formData: FormData) {
  const session = await getCustomerSession();
  if (!session) redirect("/account/login");
  const fullName = formString(formData, "fullName");
  const phoneLocal = formString(formData, "phoneLocal");
  const phone = phoneLocal ? composeGulfPhone(formString(formData, "phoneCode"), phoneLocal) : "";
  if (phoneLocal && !phone) return { error: "Enter a valid Gulf phone number" };
  try {
    const customer = await updateCustomer(session.id, { fullName, phone });
    await setCustomerSession({ id: customer.id, email: customer.email, fullName: customer.fullName });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update profile" };
  }
  revalidatePath("/account");
  revalidatePath("/account/profile");
  revalidatePath("/checkout");
  return { ok: true as const };
}

export async function subscribeNewsletterAction(formData: FormData) {
  const email = formString(formData, "email");
  if (!email) return { error: "Email is required" };
  await addNewsletter(email);
  return { ok: true };
}

export async function applyPromoAction(code: string, email: string) {
  const settings = await getStoreSettings();
  const requested = normalizePromo(code);
  if (!promoIsActive(settings) || requested !== normalizePromo(settings.promoCode)) {
    return { ok: false as const, error: "Invalid promo code" };
  }
  if (!isValidEmail(email)) return { ok: false as const, error: "Enter a valid email address" };
  if (await emailHasUsedPromo(email, settings.promoCode)) {
    return { ok: false as const, error: "This email has already used this promo code" };
  }
  return { ok: true as const, code: normalizePromo(settings.promoCode), percent: settings.promoPercent };
}

export async function placeOrderAction(input: {
  email: string;
  customerName: string;
  items: OrderItem[];
  notes?: string;
  paymentMethod?: PaymentMethod;
  promoCode?: string;
  shippingAddress: {
    line1: string;
    city: string;
    country: string;
    postalCode?: string;
    area?: string;
    phone?: string;
  };
}) {
  if (!input.items.length) return { error: "Your bag is empty" };
  const session = await getCustomerSession();
  const email = (session?.email || input.email).trim();
  const customerName = (input.customerName || session?.fullName || "").trim();
  const line1 = input.shippingAddress.line1.trim();
  const city = input.shippingAddress.city.trim();
  const country = input.shippingAddress.country.trim();
  const postalCode = (input.shippingAddress.postalCode ?? "").trim();
  const area = (input.shippingAddress.area ?? "").trim();
  const phone = parseGulfPhone(input.shippingAddress.phone ?? "")?.e164 ?? "";
  if (!isValidEmail(email)) return { error: "Enter a valid email address" };
  if (!customerName) return { error: "Full name is required" };
  if (!phone) return { error: "Enter a valid Gulf phone number" };
  if (!line1 || !city || !country) return { error: "Shipping address is required" };
  try {
    const settings = await getStoreSettings();
    const resolvedItems: OrderItem[] = [];
    for (const item of input.items) {
      const product = await getProductById(item.productId);
      if (!product) return { error: "A product in your bag is no longer available." };
      if (isDropshipSource(product.source) && !isListedOnShop(product, settings.dropshipBuffer)) {
        return { error: `${product.name} is no longer available.` };
      }
      if (isDropshipSource(product.source) && item.quantity > sellableStock(product, settings.dropshipBuffer)) {
        return { error: `${product.name} does not have enough stock.` };
      }
      resolvedItems.push({
        ...item,
        source: product.source,
        supplierProductId: product.supplierProductId,
        supplierUrl: product.supplierUrl,
      });
    }
    const order = await createOrder({
      items: resolvedItems,
      notes: input.notes,
      customerId: session?.id ?? null,
      email,
      customerName,
      paymentMethod: input.paymentMethod ?? "cod",
      promoCode: input.promoCode,
      shippingAddress: { line1, city, country, postalCode, area, phone },
    });
    await notifyOrderCreated(order);
    revalidatePath("/admin");
    revalidatePath("/account");
    return { ok: true, orderId: order.id, orderNumber: order.orderNumber, isGuest: !session };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not place order" };
  }
}

export async function saveProductAction(formData: FormData) {
  await requireAdmin();
  try {
    const id = formString(formData, "id");
    const categories = await listCategories();
    const categoryId = formString(formData, "categoryId");
    const selected = categories.find((category) => category.id === categoryId);
    const hasVariants = formString(formData, "hasVariants") === "1";
    const previous = id ? await getProductById(id) : null;
    let variants: ProductVariant[] = [];
    if (hasVariants) {
      try {
        variants = mapVariants(JSON.parse(formString(formData, "variants") || "[]"));
      } catch {
        return { error: "Could not read product variants." };
      }
      for (const variant of variants) {
        const uploaded = formData.get(`variantFile_${variant.id}`);
        if (uploaded instanceof File && uploaded.size > 0) {
          const nextImage = await uploadCategoryImage(uploaded, "variants");
          if (variant.image && variant.image !== nextImage) await removeStoredImage(variant.image);
          variant.image = nextImage;
        }
      }
    }
    if (previous) {
      const keep = new Set(hasVariants ? variants.map((variant) => variant.image).filter(Boolean) : []);
      for (const variant of previous.variants) {
        if (variant.image && !keep.has(variant.image)) await removeStoredImage(variant.image);
      }
    }
    const keepImages = csv(formString(formData, "images"));
    const uploadedImages: string[] = [];
    for (const [key, value] of formData.entries()) {
      if (!key.startsWith("imageFile_") || !(value instanceof File) || value.size <= 0) continue;
      uploadedImages.push(await uploadCategoryImage(value, "products"));
    }
    const nextImages = [...keepImages, ...uploadedImages];
    const status = (formString(formData, "status") || "active") as ProductStatus;
    if (!nextImages.length && status !== "draft") return { error: "Add at least one product image." };
    if (previous) {
      for (const image of previous.images) {
        if (!nextImages.includes(image)) await removeStoredImage(image);
      }
    }
    const payload: ProductInput = {
      name: formString(formData, "name"),
      nameAr: formString(formData, "nameAr"),
      slug: formString(formData, "slug") || undefined,
      description: formString(formData, "description"),
      descriptionAr: formString(formData, "descriptionAr"),
      category: selected?.name || formString(formData, "category"),
      categorySlug: selected?.slug || formString(formData, "categorySlug"),
      price: Number(formString(formData, "price") || 0),
      compareAtPrice: formString(formData, "compareAtPrice") ? Number(formString(formData, "compareAtPrice")) : null,
      badge: (formString(formData, "badge") || null) as ProductBadge,
      images: nextImages,
      sku: formString(formData, "sku"),
      sizes: csv(formString(formData, "sizes")),
      colors: csv(formString(formData, "colors")),
      stock: hasVariants ? productStock({ stock: 0, hasVariants: true, variants }) : Number(formString(formData, "stock") || 0),
      hasVariants,
      variants: hasVariants ? variants : [],
      status: (formString(formData, "status") || "active") as ProductStatus,
      source: normalizeProductSource(formString(formData, "source")),
      supplierUrl: formString(formData, "supplierUrl"),
      supplierProductId: formString(formData, "supplierProductId"),
      supplierStock: Number(formString(formData, "supplierStock") || formString(formData, "stock") || 0),
    };
    if (!payload.name) return { error: "Name is required." };
    if (hasVariants && payload.variants && payload.variants.length === 0) {
      return { error: "Add at least one size or color to create variants." };
    }
    if (id) await updateProduct(id, payload);
    else await createProduct(payload);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save product." };
  }
  revalidatePath("/admin/products");
  revalidatePath("/shop");
  revalidatePath("/");
  return { ok: true as const };
}

export async function importProductsAction(records: Record<string, unknown>[]) {
  await requireAdmin();
  try {
    const [categories, existing] = await Promise.all([listCategories(), listAllProducts()]);
    const preview = validateProductImport(records, categories, existing);
    if (preview.error) return { error: preview.error };
    const invalid = preview.rows.find((row) => row.errors.length);
    if (invalid) {
      return { error: `Row ${invalid.row} is missing ${invalid.errors.join(", ")}.` };
    }
    for (const row of preview.rows) {
      const payload = importRowToInput(row, categories);
      if ("error" in payload) return { error: payload.error };
      await createProduct(payload);
    }
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/");
    return { ok: true as const, count: preview.rows.length };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not import products." };
  }
}

export async function deleteProductAction(formData: FormData) {
  await requireAdmin();
  try {
    await deleteProduct(formString(formData, "id"));
    revalidatePath("/admin/products");
    revalidatePath("/shop");
    revalidatePath("/");
    return { ok: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not delete product." };
  }
}

function revalidateOrderPaths(id: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/orders");
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/account");
  revalidatePath("/account/orders");
}

export async function updateOrderStatusAction(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "id");
  const status = formString(formData, "status") as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) return { error: "Invalid order status." };
  try {
    const previous = await getOrderById(id);
    const order = await updateOrder(id, { status });
    if (previous && shouldSendReadyToShip(previous.status, order.status)) {
      await notifyOrderReadyToShip(order);
    }
    revalidateOrderPaths(id);
    return { ok: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update order." };
  }
}

export async function updateOrderPaymentAction(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "id");
  const paymentStatus = formString(formData, "paymentStatus") as PaymentStatus;
  if (paymentStatus !== "paid" && paymentStatus !== "unpaid") return { error: "Invalid payment status." };
  try {
    await updateOrder(id, { paymentStatus });
    revalidateOrderPaths(id);
    return { ok: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update payment." };
  }
}

export async function updateCustomerStatusAction(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "id");
  const status = formString(formData, "status") as CustomerStatus;
  if (status !== "active" && status !== "blocked") return { error: "Invalid customer status." };
  try {
    const customer = await getCustomerById(id);
    if (!customer) return { error: "Customer not found." };
    if (customer.role === "admin") return { error: "Administrator accounts cannot be blocked." };
    await updateCustomer(id, { status });
    revalidatePath("/admin/customers");
    revalidatePath(`/admin/customers/${id}`);
    return { ok: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update customer." };
  }
}

export async function saveCategoryAction(formData: FormData) {
  await requireAdmin();
  try {
    const id = formString(formData, "id") || undefined;
    const previous = id ? await getCategoryById(id) : null;
    let image = previous?.image ?? "";
    const uploaded = formData.get("imageFile");
    if (uploaded instanceof File && uploaded.size > 0) {
      image = await uploadCategoryImage(uploaded);
      if (previous?.image && previous.image !== image) await removeStoredImage(previous.image);
    } else if (formString(formData, "removeImage") === "1") {
      if (previous?.image) await removeStoredImage(previous.image);
      image = "";
    }
    const parentId = formString(formData, "parentId");
    await upsertCategory({
      id,
      parentId: parentId ? parentId : null,
      name: formString(formData, "name"),
      nameAr: formString(formData, "nameAr"),
      slug: formString(formData, "slug"),
      subtitle: formString(formData, "subtitle"),
      subtitleAr: formString(formData, "subtitleAr"),
      image,
      sortOrder: Number(formString(formData, "sortOrder") || 0),
    });
    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin/products");
    return { ok: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save category." };
  }
}

export async function deleteCategoryAction(formData: FormData) {
  await requireAdmin();
  try {
    await deleteCategory(formString(formData, "id"));
    revalidatePath("/admin/categories");
    revalidatePath("/");
    revalidatePath("/shop");
    revalidatePath("/admin/products");
    return { ok: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not delete category." };
  }
}

export async function saveStoreSettingsAction(formData: FormData) {
  await requireAdmin();
  const freeShippingFrom = Number(formString(formData, "freeShippingFrom"));
  const shippingFee = Number(formString(formData, "shippingFee"));
  const returnDays = Number(formString(formData, "returnDays"));
  const promoCode = normalizePromo(formString(formData, "promoCode"));
  const promoPercent = Number(formString(formData, "promoPercent"));
  const current = await getStoreSettings();
  const dropshipEnabled = DROPSHIP_UI_ENABLED
    ? formString(formData, "dropshipEnabled") === "1"
    : current.dropshipEnabled;
  const dropshipBuffer = DROPSHIP_UI_ENABLED
    ? Number(formString(formData, "dropshipBuffer"))
    : current.dropshipBuffer;
  if (!Number.isFinite(freeShippingFrom) || freeShippingFrom < 0) {
    return { error: "Enter a valid free-shipping threshold." };
  }
  if (!Number.isFinite(shippingFee) || shippingFee < 0) {
    return { error: "Enter a valid shipping fee." };
  }
  if (!Number.isFinite(returnDays) || returnDays < 1) {
    return { error: "Enter a valid return window in days." };
  }
  if (promoCode && (!Number.isFinite(promoPercent) || promoPercent < 1 || promoPercent > 100)) {
    return { error: "Enter a promo discount between 1 and 100." };
  }
  if (!Number.isFinite(dropshipBuffer) || dropshipBuffer < 0) {
    return { error: "Enter a valid dropship stock buffer." };
  }
  try {
    await updateStoreSettings({
      freeShippingFrom,
      shippingFee,
      returnDays,
      promoCode,
      promoPercent: promoCode ? promoPercent : 0,
      dropshipEnabled,
      dropshipBuffer,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save settings." };
  }
  revalidatePath("/");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/admin/settings");
  revalidatePath("/admin/dropship");
  revalidatePath("/shop");
  return { ok: true as const };
}

export async function importDropshipProductAction(formData: FormData) {
  await requireAdmin();
  if (!DROPSHIP_UI_ENABLED) return { error: "Dropshipping is not available yet." };
  const parsed = parseSupplierUrl(formString(formData, "url"));
  if ("error" in parsed) return { error: parsed.error };
  const categories = await listCategories();
  const categoryId = formString(formData, "categoryId");
  const selected = categories.find((category) => category.id === categoryId) ?? categories[0];
  if (!selected) return { error: "Create a category before importing a dropship product." };
  const price = Number(formString(formData, "price") || 0);
  if (!Number.isFinite(price) || price <= 0) return { error: "Enter the sell price before importing." };
  const name = formString(formData, "name") || parsed.title;
  try {
    const product = await createProduct({
      name,
      nameAr: "",
      description: `Imported from ${parsed.source === "aliexpress" ? "AliExpress" : "Temu"}. Review before publishing.`,
      descriptionAr: "",
      category: selected.name,
      categorySlug: selected.slug,
      price,
      images: [],
      sku: parsed.sku,
      sizes: [],
      colors: [],
      stock: 0,
      status: "draft",
      source: parsed.source,
      supplierUrl: parsed.supplierUrl,
      supplierProductId: parsed.supplierProductId,
      supplierStock: 0,
    });
    revalidatePath("/admin/products");
    revalidatePath("/admin/dropship");
    return { ok: true as const, productId: product.id };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not import product." };
  }
}

export async function retryDropshipShipmentAction(formData: FormData) {
  await requireAdmin();
  if (!DROPSHIP_UI_ENABLED) return { error: "Dropshipping is not available yet." };
  const orderId = formString(formData, "orderId");
  const shipmentId = formString(formData, "shipmentId");
  try {
    const order = await getOrderById(orderId);
    if (!order) return { error: "Order not found." };
    const shipment = (order.shipments ?? []).find((item) => item.id === shipmentId);
    if (!shipment) return { error: "Shipment not found." };
    if (!canManualRetry(shipment)) return { error: "This shipment cannot be retried." };
    await fulfillDropshipShipments(order, { shipmentId });
    revalidateOrderPaths(order.id);
    revalidatePath("/admin/dropship");
    return { ok: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not retry supplier order." };
  }
}

function parseExpenseFiles(raw: string): ExpenseFile[] {
  try {
    const parsed = JSON.parse(raw || "[]") as ExpenseFile[];
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((file) => file && typeof file === "object" && file.id && file.path && file.name)
      .slice(0, MAX_EXPENSE_FILES)
      .map((file) => ({
        id: String(file.id),
        path: String(file.path),
        name: String(file.name),
        size: Number(file.size) || 0,
        type: String(file.type || "application/octet-stream"),
      }));
  } catch {
    return [];
  }
}

export async function uploadExpenseFileAction(formData: FormData) {
  await requireAdmin();
  const file = formData.get("file");
  if (!(file instanceof File) || file.size <= 0) return { error: "Choose a file to upload." };
  try {
    const uploaded = await uploadExpenseFile(file);
    return { ok: true as const, file: uploaded };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not upload file." };
  }
}

export async function removeExpenseFileAction(formData: FormData) {
  await requireAdmin();
  const path = formString(formData, "path");
  try {
    await removeExpenseFile(path);
    return { ok: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not remove file." };
  }
}

export async function saveExpenseAction(formData: FormData) {
  await requireAdmin();
  const id = formString(formData, "id");
  const amount = Number(formString(formData, "amount"));
  const incurredOn = formString(formData, "incurredOn") || todayIsoDate();
  const category = formString(formData, "category");
  const subcategory = formString(formData, "subcategory");
  const notes = formString(formData, "notes");
  const files = parseExpenseFiles(formString(formData, "files"));
  if (!Number.isFinite(amount) || amount <= 0) return { error: "Enter an amount greater than 0." };
  if (!/^\d{4}-\d{2}-\d{2}$/.test(incurredOn)) return { error: "Enter a valid date." };
  if (!isValidExpensePair(category, subcategory)) return { error: "Choose a valid category and sub-category." };
  try {
    const payload = { amount, incurredOn, category, subcategory, notes, files };
    if (id) await updateExpense(id, payload);
    else await createExpense(payload);
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save expense." };
  }
  revalidatePath("/admin/expenses");
  return { ok: true as const };
}

export async function deleteExpenseAction(formData: FormData) {
  await requireAdmin();
  try {
    await deleteExpense(formString(formData, "id"));
    revalidatePath("/admin/expenses");
    return { ok: true as const };
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not delete expense." };
  }
}
