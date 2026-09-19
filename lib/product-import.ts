import { slugify } from "@/lib/format";
import { csvList, productStock, syncProductVariants } from "@/lib/products";
import type { Category, Product, ProductBadge, ProductInput, ProductStatus } from "@/types";

export const PRODUCT_IMPORT_MAX_ROWS = 200;
export const PRODUCT_IMPORT_REQUIRED = ["name", "category", "price", "sku", "stock", "images"] as const;

export const PRODUCT_IMPORT_COLUMNS = [
  "name",
  "name_ar",
  "slug",
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
  slug: "slug",
  url_slug: "slug",
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
  errors: string[];
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

function findCategory(categories: Category[], value: string) {
  const needle = value.trim().toLowerCase();
  if (!needle) return null;
  return (
    categories.find((category) => category.slug.toLowerCase() === needle) ??
    categories.find((category) => category.name.toLowerCase() === needle) ??
    categories.find((category) => category.nameAr.trim().toLowerCase() === needle) ??
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
  return categories[0]?.slug || "your-category-slug";
}

export function sampleImportRows(categories: Category[]): Record<(typeof PRODUCT_IMPORT_COLUMNS)[number], string>[] {
  const category = sampleImportCategory(categories);
  return [
    {
      name: "Classic Court Shirt",
      name_ar: "قميص الملعب الكلاسيكي",
      slug: "",
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
      slug: "",
      description: "Lightweight shorts with a secure waistband.",
      description_ar: "شورت خفيف بحزام مريح.",
      category,
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

export const PRODUCT_IMPORT_GUIDE: { column: string; required: boolean; format: string }[] = [
  { column: "name", required: true, format: "English product name" },
  { column: "name_ar", required: false, format: "Arabic name, optional" },
  { column: "slug", required: false, format: "URL slug. Leave blank to generate from the name" },
  { column: "description", required: false, format: "English description" },
  { column: "description_ar", required: false, format: "Arabic description" },
  { column: "category", required: true, format: "Existing category slug or name" },
  { column: "price", required: true, format: "Sell price in QAR, greater than 0" },
  { column: "compare_at_price", required: false, format: "Compare-at price, or leave blank" },
  { column: "sku", required: true, format: "Unique SKU" },
  { column: "stock", required: true, format: "Whole number, 0 or more" },
  { column: "sizes", required: false, format: "Comma-separated, e.g. S, M, L" },
  { column: "colors", required: false, format: "Comma-separated, e.g. Black, White" },
  { column: "badge", required: false, format: "NEW, SALE, BESTSELLER, TRENDING, or blank" },
  { column: "status", required: false, format: "draft or active. Defaults to draft" },
  { column: "has_variants", required: false, format: "yes or no. Use yes only if each size/color has its own stock" },
  { column: "images", required: true, format: "Public image URLs, comma-separated" },
];

export async function buildSampleXlsx(categories: Category[]) {
  const XLSX = await import("xlsx");
  const workbook = XLSX.utils.book_new();
  const products = XLSX.utils.json_to_sheet(sampleImportRows(categories), { header: [...PRODUCT_IMPORT_COLUMNS] });
  const guide = XLSX.utils.json_to_sheet(
    PRODUCT_IMPORT_GUIDE.map((item) => ({
      column: item.column,
      required: item.required ? "yes" : "no",
      format: item.format,
    })),
  );
  XLSX.utils.book_append_sheet(workbook, products, "Products");
  XLSX.utils.book_append_sheet(workbook, guide, "Instructions");
  const bytes = XLSX.write(workbook, { type: "array", bookType: "xlsx" }) as ArrayBuffer;
  return new Blob([bytes], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
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
    const price = Number(mapped.price ?? "");
    const stock = Number(mapped.stock ?? "");
    const compareRaw = mapped.compare_at_price ?? "";
    const compareAtPrice = compareRaw === "" ? null : Number(compareRaw);
    const images = imageList(mapped.images ?? "");
    const sizes = csvList(mapped.sizes ?? "");
    const colors = csvList(mapped.colors ?? "");
    const badgeRaw = (mapped.badge ?? "").toUpperCase();
    const statusRaw = (mapped.status ?? "draft").toLowerCase();
    const status: ProductStatus = statusRaw === "active" ? "active" : "draft";
    const hasVariants = /^(1|yes|true|y)$/i.test(mapped.has_variants ?? "");
    const errors: string[] = [];

    if (!name) errors.push("name");
    if (!categoryValue) errors.push("category");
    else if (!category) errors.push("category (not found)");
    if (!Number.isFinite(price) || price <= 0) errors.push("price");
    if (compareRaw && (!Number.isFinite(compareAtPrice) || Number(compareAtPrice) < 0)) errors.push("compare_at_price");
    if (!sku) errors.push("sku");
    else if (usedSkus.has(sku.toLowerCase())) errors.push("sku (duplicate)");
    if (!Number.isFinite(stock) || stock < 0 || !Number.isInteger(stock)) errors.push("stock");
    if (!images.length) errors.push("images");
    if (badgeRaw && !BADGES.has(badgeRaw)) errors.push("badge");
    if (mapped.status && statusRaw !== "active" && statusRaw !== "draft") errors.push("status");

    const slug = uniqueSlug(mapped.slug || name || `product-${index + 1}`, usedSlugs);
    if (sku) usedSkus.add(sku.toLowerCase());

    rows.push({
      row: index + 2,
      name,
      nameAr: mapped.name_ar ?? "",
      slug,
      description: mapped.description ?? "",
      descriptionAr: mapped.description_ar ?? "",
      category: category?.name || categoryValue,
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
  if (row.errors.length) return { error: `Row ${row.row} is missing ${row.errors.join(", ")}.` };
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
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
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
