import { slugify } from "@/lib/format";
import type { MessageKey } from "@/lib/i18n";
import { csvList, productStock, syncProductVariants } from "@/lib/products";
import type { Category, Product, ProductBadge, ProductInput, ProductStatus } from "@/types";

export const PRODUCT_IMPORT_MAX_ROWS = 200;
export const PRODUCT_IMPORT_REQUIRED = ["name", "category", "price", "sku", "stock", "images"] as const;

export const PRODUCT_IMPORT_COLUMNS = [
  "name",
  "name_ar",
  "description",
  "description_ar",
  "category",
  "price",
  "compare_at_price",
  "sku",
  "stock",
  "sizes",
  "colors",
  "badge",
  "status",
  "has_variants",
  "images",
] as const;

const HEADER_ALIASES: Record<string, (typeof PRODUCT_IMPORT_COLUMNS)[number]> = {
  name: "name",
  name_en: "name",
  name_english: "name",
  title: "name",
  name_ar: "name_ar",
  name_arabic: "name_ar",
  description: "description",
  description_en: "description",
  description_english: "description",
  description_ar: "description_ar",
  description_arabic: "description_ar",
  category: "category",
  category_slug: "category",
  category_name: "category",
  price: "price",
  compare_at_price: "compare_at_price",
  compare_price: "compare_at_price",
  sku: "sku",
  stock: "stock",
  qty: "stock",
  quantity: "stock",
  sizes: "sizes",
  size: "sizes",
  colors: "colors",
  color: "colors",
  badge: "badge",
  status: "status",
  has_variants: "has_variants",
  variants: "has_variants",
  images: "images",
  image: "images",
  image_urls: "images",
};

const BADGES = new Set(["NEW", "SALE", "BESTSELLER", "TRENDING"]);

export type ProductImportIssue = {
  field: "name" | "category" | "price" | "sku" | "stock" | "images" | "badge" | "status" | "compare_at_price";
  key: MessageKey;
};

export type ProductImportRow = {
  row: number;
  name: string;
  nameAr: string;
  slug: string;
  description: string;
  descriptionAr: string;
  category: string;
  price: number;
  compareAtPrice: number | null;
  sku: string;
  stock: number;
  sizes: string[];
  colors: string[];
  badge: ProductBadge;
  status: ProductStatus;
  hasVariants: boolean;
  images: string[];
  errors: ProductImportIssue[];
};

export type ProductImportPreview = {
  rows: ProductImportRow[];
  error?: string;
};

function headerKey(value: string) {
  return value.trim().toLowerCase().replace(/[^a-z0-9]+/g, "_").replace(/^_|_$/g, "");
}

function cell(value: unknown) {
  return String(value ?? "").replace(/^\uFEFF/, "").trim();
}

function splitList(value: string) {
  return value.split(/[,|;]+/).map((item) => item.trim()).filter(Boolean);
}

function imageList(value: string) {
  return value
    .split(/[,|;]+/)
    .map((item) => item.trim())
    .filter((item) => /^https?:\/\//i.test(item));
}

export function categorySelectLabel(category: Category, categories: Category[]) {
  const parent = category.parentId ? categories.find((item) => item.id === category.parentId) : null;
  return parent ? `${parent.name} / ${category.name}` : category.name;
}

export function categorySelectValues(categories: Category[]) {
  const sorted = [...categories].sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
  const labels = sorted.map((category) => categorySelectLabel(category, categories));
  const counts = labels.reduce<Record<string, number>>((acc, label) => {
    acc[label] = (acc[label] ?? 0) + 1;
    return acc;
  }, {});
  return sorted.map((category) => {
    const label = categorySelectLabel(category, categories);
    return counts[label] > 1 ? `${label} (${category.slug})` : label;
  });
}

function findCategory(categories: Category[], value: string) {
  const needle = value.trim().toLowerCase();
  if (!needle) return null;
  return (
    categories.find((category) => category.slug.toLowerCase() === needle) ??
    categories.find((category) => category.name.toLowerCase() === needle) ??
    categories.find((category) => category.nameAr.trim().toLowerCase() === needle) ??
    categories.find((category) => categorySelectLabel(category, categories).toLowerCase() === needle) ??
    categories.find((category) => `${categorySelectLabel(category, categories)} (${category.slug})`.toLowerCase() === needle) ??
    null
  );
}

function uniqueSlug(base: string, used: Set<string>) {
  const root = slugify(base) || "product";
  let slug = root;
  let n = 2;
  while (used.has(slug)) {
    slug = `${root}-${n}`;
    n += 1;
  }
  used.add(slug);
  return slug;
}

export function sampleImportCategory(categories: Category[]) {
  return categorySelectValues(categories)[0] || "";
}

export function sampleImportRows(categories: Category[]): Record<(typeof PRODUCT_IMPORT_COLUMNS)[number], string>[] {
  const labels = categorySelectValues(categories);
  const category = labels[0] || "";
  const secondCategory = labels[1] || category;
  return [
    {
      name: "Classic Court Shirt",
      name_ar: "قميص الملعب الكلاسيكي",
      description: "Breathable performance shirt for training and match days.",
      description_ar: "قميص مريح للتدريب وأيام المباريات.",
      category,
      price: "180",
      compare_at_price: "220",
      sku: "SAMPLE-SHIRT-001",
      stock: "12",
      sizes: "S, M, L, XL",
      colors: "Black, White",
      badge: "NEW",
      status: "draft",
      has_variants: "no",
      images: "https://example.com/shirt-front.jpg, https://example.com/shirt-back.jpg",
    },
    {
      name: "Match Shorts",
      name_ar: "شورت المباراة",
      description: "Lightweight shorts with a secure waistband.",
      description_ar: "شورت خفيف بحزام مريح.",
      category: secondCategory,
      price: "120",
      compare_at_price: "",
      sku: "SAMPLE-SHORT-001",
      stock: "20",
      sizes: "S, M, L",
      colors: "Navy",
      badge: "",
      status: "draft",
      has_variants: "no",
      images: "https://example.com/shorts.jpg",
    },
  ];
}

export function buildSampleCsv(categories: Category[]) {
  const rows = sampleImportRows(categories);
  const escape = (value: string) => `"${value.replaceAll('"', '""')}"`;
  return [
    PRODUCT_IMPORT_COLUMNS.join(","),
    ...rows.map((row) => PRODUCT_IMPORT_COLUMNS.map((key) => escape(row[key])).join(",")),
  ].join("\n");
}

export function validateProductImport(
  records: Record<string, unknown>[],
  categories: Category[],
  existing: Pick<Product, "sku" | "slug">[],
): ProductImportPreview {
  if (!records.length) return { rows: [], error: "The file has no product rows." };
  if (records.length > PRODUCT_IMPORT_MAX_ROWS) {
    return { rows: [], error: `Import up to ${PRODUCT_IMPORT_MAX_ROWS} products at a time.` };
  }

  const usedSkus = new Set(existing.map((product) => product.sku.trim().toLowerCase()).filter(Boolean));
  const usedSlugs = new Set(existing.map((product) => product.slug.trim().toLowerCase()).filter(Boolean));
  const rows: ProductImportRow[] = [];

  for (const [index, record] of records.entries()) {
    const mapped: Partial<Record<(typeof PRODUCT_IMPORT_COLUMNS)[number], string>> = {};
    for (const [rawKey, rawValue] of Object.entries(record)) {
      const key = HEADER_ALIASES[headerKey(rawKey)];
      if (key) mapped[key] = cell(rawValue);
    }

    const name = mapped.name ?? "";
    const sku = mapped.sku ?? "";
    const categoryValue = mapped.category ?? "";
    const category = findCategory(categories, categoryValue);
    const priceRaw = mapped.price ?? "";
    const price = Number(priceRaw);
    const stockRaw = mapped.stock ?? "";
    const stock = Number(stockRaw);
    const compareRaw = mapped.compare_at_price ?? "";
    const compareAtPrice = compareRaw === "" ? null : Number(compareRaw);
    const images = imageList(mapped.images ?? "");
    const sizes = csvList(mapped.sizes ?? "");
    const colors = csvList(mapped.colors ?? "");
    const badgeRaw = (mapped.badge ?? "").toUpperCase();
    const statusRaw = (mapped.status ?? "draft").toLowerCase();
    const status: ProductStatus = statusRaw === "active" ? "active" : "draft";
    const hasVariants = /^(1|yes|true|y)$/i.test(mapped.has_variants ?? "");
    const errors: ProductImportIssue[] = [];

    if (!name) errors.push({ field: "name", key: "importMissingName" });
    if (!categoryValue) errors.push({ field: "category", key: "importMissingCategory" });
    else if (!category) errors.push({ field: "category", key: "importUnknownCategory" });
    if (!priceRaw) errors.push({ field: "price", key: "importMissingPrice" });
    else if (!Number.isFinite(price) || price <= 0) errors.push({ field: "price", key: "importInvalidPrice" });
    if (compareRaw && (!Number.isFinite(compareAtPrice) || Number(compareAtPrice) < 0)) {
      errors.push({ field: "compare_at_price", key: "importInvalidCompare" });
    }
    if (!sku) errors.push({ field: "sku", key: "importMissingSku" });
    else if (usedSkus.has(sku.toLowerCase())) errors.push({ field: "sku", key: "importDuplicateSku" });
    if (!stockRaw) errors.push({ field: "stock", key: "importMissingStock" });
    else if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) {
      errors.push({ field: "stock", key: "importInvalidStock" });
    }
    if (!images.length) errors.push({ field: "images", key: "importMissingImages" });
    if (badgeRaw && !BADGES.has(badgeRaw)) errors.push({ field: "badge", key: "importInvalidBadge" });
    if (mapped.status && statusRaw !== "active" && statusRaw !== "draft") {
      errors.push({ field: "status", key: "importInvalidStatus" });
    }

    const slug = uniqueSlug(name || `product-${index + 1}`, usedSlugs);
    if (sku) usedSkus.add(sku.toLowerCase());

    rows.push({
      row: index + 2,
      name,
      nameAr: mapped.name_ar ?? "",
      slug,
      description: mapped.description ?? "",
      descriptionAr: mapped.description_ar ?? "",
      category: category ? categorySelectLabel(category, categories) : categoryValue,
      price: Number.isFinite(price) ? price : 0,
      compareAtPrice: Number.isFinite(compareAtPrice) ? compareAtPrice : null,
      sku,
      stock: Number.isFinite(stock) ? stock : 0,
      sizes,
      colors,
      badge: BADGES.has(badgeRaw) ? (badgeRaw as ProductBadge) : null,
      status,
      hasVariants,
      images,
      errors,
    });
  }

  return { rows };
}

export function importRowToInput(row: ProductImportRow, categories: Category[]): ProductInput | { error: string } {
  if (row.errors.length) return { error: `Row ${row.row} is missing ${row.errors.map((item) => item.field).join(", ")}.` };
  const category = findCategory(categories, row.category);
  if (!category) return { error: `Row ${row.row} has an unknown category.` };
  const hasVariants = row.hasVariants && (row.sizes.length > 0 || row.colors.length > 0);
  const variants = hasVariants
    ? syncProductVariants([], row.sizes, row.colors, {
        price: row.price,
        stock: row.stock,
        sku: row.sku,
        compareAtPrice: row.compareAtPrice,
      })
    : [];
  return {
    name: row.name,
    nameAr: row.nameAr,
    slug: row.slug,
    description: row.description,
    descriptionAr: row.descriptionAr,
    category: category.name,
    categorySlug: category.slug,
    price: row.price,
    compareAtPrice: row.compareAtPrice,
    badge: row.badge,
    images: row.images,
    sku: row.sku,
    sizes: row.sizes,
    colors: row.colors,
    stock: hasVariants ? productStock({ stock: 0, hasVariants: true, variants }) : row.stock,
    hasVariants,
    variants,
    status: row.status,
  };
}

export async function parseProductImportFile(file: File): Promise<Record<string, unknown>[]> {
  const name = file.name.toLowerCase();
  if (name.endsWith(".csv") || file.type === "text/csv") {
    return parseCsv(await file.text());
  }
  const XLSX = await import("xlsx");
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheetName = workbook.SheetNames.find((name) => name !== "Categories") ?? workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  if (!sheet) return [];
  return XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: "", raw: false });
}

function parseCsv(text: string): Record<string, unknown>[] {
  const rows = splitCsv(text);
  const header = rows[0] ?? [];
  return rows.slice(1).filter((row) => row.some((cellValue) => cell(cellValue))).map((row) => {
    const record: Record<string, unknown> = {};
    header.forEach((key, index) => {
      record[cell(key)] = row[index] ?? "";
    });
    return record;
  });
}

function splitCsv(text: string) {
  const rows: string[][] = [];
  let row: string[] = [];
  let current = "";
  let quoted = false;
  const input = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < input.length; i += 1) {
    const char = input[i];
    if (char === '"') {
      if (quoted && input[i + 1] === '"') {
        current += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }
    if (char === "," && !quoted) {
      row.push(current);
      current = "";
      continue;
    }
    if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && input[i + 1] === "\n") i += 1;
      row.push(current);
      rows.push(row);
      row = [];
      current = "";
      continue;
    }
    current += char;
  }
  if (current || row.length) {
    row.push(current);
    rows.push(row);
  }
  return rows.filter((item) => item.some((value) => value.trim()));
}
