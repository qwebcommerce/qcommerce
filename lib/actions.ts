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
  emailHasUsedPromo,
  getCategoryById,
  getProductById,
  getStoreSettings,
  listCategories,
  updateCustomer,
  updateOrderStatus,
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
import { normalizePromo, promoIsActive } from "@/lib/format";
import { productStock } from "@/lib/products";
import { removeStoredImage, uploadCategoryImage } from "@/lib/storage";
import { isValidEmail, parseGulfPhone } from "@/lib/validation";
import type { OrderItem, OrderStatus, PaymentMethod, ProductBadge, ProductInput, ProductStatus, ProductVariant } from "@/types";

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
  try {
    const customer = await updateCustomer(session.id, {
      fullName: formString(formData, "fullName"),
      phone: formString(formData, "phone"),
    });
    await setCustomerSession({ id: customer.id, email: customer.email, fullName: customer.fullName });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not update profile" };
  }
  revalidatePath("/account");
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
  const phone = parseGulfPhone(input.shippingAddress.phone ?? "")?.e164 ?? "";
  if (!isValidEmail(email)) return { error: "Enter a valid email address" };
  if (!customerName) return { error: "Full name is required" };
  if (!phone) return { error: "Enter a valid Gulf phone number" };
  if (!line1 || !city || !country) return { error: "Shipping address is required" };
  try {
    const order = await createOrder({
      items: input.items,
      notes: input.notes,
      customerId: session?.id ?? null,
      email,
      customerName,
      paymentMethod: input.paymentMethod ?? "cod",
      promoCode: input.promoCode,
      shippingAddress: { line1, city, country, phone },
    });
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
    if (!nextImages.length) return { error: "Add at least one product image." };
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
  try {
    await updateStoreSettings({
      freeShippingFrom,
      shippingFee,
      returnDays,
      promoCode,
      promoPercent: promoCode ? promoPercent : 0,
    });
  } catch (error) {
    return { error: error instanceof Error ? error.message : "Could not save settings." };
  }
  revalidatePath("/");
  revalidatePath("/cart");
  revalidatePath("/checkout");
  revalidatePath("/admin/settings");
  return { ok: true as const };
}
