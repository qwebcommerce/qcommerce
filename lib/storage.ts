import "server-only";
import { hasSupabaseSecret, supabaseSecretKey, supabaseUrl } from "@/lib/supabase/env";

export const CATEGORY_IMAGE_BUCKET = "category-images";
export const MAX_CATEGORY_IMAGE_BYTES = 10 * 1024 * 1024;
export const CATEGORY_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"] as const;

const EXTENSIONS: Record<(typeof CATEGORY_IMAGE_TYPES)[number], string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
};

async function storageFetch(path: string, init: RequestInit = {}, useBearer = false) {
  if (!hasSupabaseSecret()) throw new Error("Set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SECRET_KEY.");
  const key = supabaseSecretKey();
  const headers = new Headers(init.headers);
  headers.set("apikey", key);
  if (useBearer || (!key.startsWith("sb_secret_") && !key.startsWith("sb_publishable_"))) {
    headers.set("Authorization", `Bearer ${key}`);
  }
  const response = await fetch(`${supabaseUrl()}/storage/v1${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
  if (!useBearer && (response.status === 401 || response.status === 403) && key.startsWith("sb_secret_")) {
    return storageFetch(path, init, true);
  }
  return response;
}

function sniffImageType(bytes: Uint8Array): (typeof CATEGORY_IMAGE_TYPES)[number] | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "image/jpeg";
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return "image/png";
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return "image/gif";
  if (
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    return "image/webp";
  }
  const brand = String.fromCharCode(bytes[8], bytes[9], bytes[10], bytes[11]);
  if (String.fromCharCode(bytes[4], bytes[5], bytes[6], bytes[7]) === "ftyp" && (brand === "avif" || brand === "avis")) {
    return "image/avif";
  }
  return null;
}

export function publicImageUrl(objectPath: string) {
  return `${supabaseUrl()}/storage/v1/object/public/${CATEGORY_IMAGE_BUCKET}/${objectPath}`;
}

function objectPathFromUrl(url: string) {
  const markers = [
    `/storage/v1/object/public/${CATEGORY_IMAGE_BUCKET}/`,
    `/storage/v1/object/sign/${CATEGORY_IMAGE_BUCKET}/`,
    `/storage/v1/render/image/public/${CATEGORY_IMAGE_BUCKET}/`,
  ];
  for (const marker of markers) {
    const index = url.indexOf(marker);
    if (index === -1) continue;
    return decodeURIComponent(url.slice(index + marker.length).split("?")[0]);
  }
  return null;
}

async function ensureCategoryImageBucket() {
  const existing = await storageFetch(`/bucket/${CATEGORY_IMAGE_BUCKET}`);
  if (existing.ok) return;
  const created = await storageFetch("/bucket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: CATEGORY_IMAGE_BUCKET,
      name: CATEGORY_IMAGE_BUCKET,
      public: true,
      file_size_limit: MAX_CATEGORY_IMAGE_BYTES,
      allowed_mime_types: CATEGORY_IMAGE_TYPES,
    }),
  });
  if (!created.ok && created.status !== 409) {
    const detail = await created.text();
    throw new Error(detail || "Could not create image storage.");
  }
}

export async function uploadCategoryImage(file: File, folder = "categories"): Promise<string> {
  if (file.size <= 0) throw new Error("Choose an image to upload.");
  if (file.size > MAX_CATEGORY_IMAGE_BYTES) throw new Error("Image must be 10 MB or smaller.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffImageType(bytes);
  if (!type) throw new Error("Only JPEG, PNG, WebP, GIF or AVIF images are allowed.");
  await ensureCategoryImageBucket();
  const prefix = folder.replace(/[^a-z0-9/_-]/gi, "") || "categories";
  const objectPath = `${prefix}/${crypto.randomUUID()}.${EXTENSIONS[type]}`;
  const uploaded = await storageFetch(`/object/${CATEGORY_IMAGE_BUCKET}/${objectPath}`, {
    method: "POST",
    headers: {
      "Content-Type": type,
      "x-upsert": "true",
      "cache-control": "3600",
    },
    body: bytes,
  });
  if (!uploaded.ok) {
    const detail = await uploaded.text();
    throw new Error(detail || "Could not upload image.");
  }
  return publicImageUrl(objectPath);
}

export async function removeStoredImage(url: string | null | undefined) {
  if (!url) return;
  const objectPath = objectPathFromUrl(url);
  if (!objectPath) return;
  const response = await storageFetch(`/object/${CATEGORY_IMAGE_BUCKET}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [objectPath] }),
  });
  if (!response.ok && response.status !== 404) {
    const detail = await response.text();
    throw new Error(detail || "Could not remove image.");
  }
}

export const EXPENSE_FILE_BUCKET = "expense-documents";
export const MAX_EXPENSE_FILE_BYTES = 10 * 1024 * 1024;
export const EXPENSE_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/avif",
  "application/pdf",
  "text/csv",
  "text/plain",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
] as const;

const EXPENSE_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
  "image/avif": "avif",
  "application/pdf": "pdf",
  "text/csv": "csv",
  "text/plain": "txt",
  "application/msword": "doc",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "docx",
  "application/vnd.ms-excel": "xls",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": "xlsx",
};

const EXPENSE_EXT_TYPES: Record<string, (typeof EXPENSE_FILE_TYPES)[number]> = {
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
  avif: "image/avif",
  pdf: "application/pdf",
  csv: "text/csv",
  txt: "text/plain",
  doc: "application/msword",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  xls: "application/vnd.ms-excel",
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
};

function sniffExpenseType(bytes: Uint8Array, file: File): (typeof EXPENSE_FILE_TYPES)[number] | null {
  const image = sniffImageType(bytes);
  if (image) return image;
  if (bytes.length >= 4 && bytes[0] === 0x25 && bytes[1] === 0x50 && bytes[2] === 0x44 && bytes[3] === 0x46) {
    return "application/pdf";
  }
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "";
  const fromName = EXPENSE_EXT_TYPES[ext];
  if (fromName) return fromName;
  if ((EXPENSE_FILE_TYPES as readonly string[]).includes(file.type)) {
    return file.type as (typeof EXPENSE_FILE_TYPES)[number];
  }
  return null;
}

async function ensureExpenseFileBucket() {
  const existing = await storageFetch(`/bucket/${EXPENSE_FILE_BUCKET}`);
  if (existing.ok) return;
  const created = await storageFetch("/bucket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id: EXPENSE_FILE_BUCKET,
      name: EXPENSE_FILE_BUCKET,
      public: false,
      file_size_limit: MAX_EXPENSE_FILE_BYTES,
      allowed_mime_types: EXPENSE_FILE_TYPES,
    }),
  });
  if (!created.ok && created.status !== 409) {
    const detail = await created.text();
    throw new Error(detail || "Could not create expense storage.");
  }
}

export async function uploadExpenseFile(file: File) {
  if (file.size <= 0) throw new Error("Choose a file to upload.");
  if (file.size > MAX_EXPENSE_FILE_BYTES) throw new Error("File must be 10 MB or smaller.");
  const bytes = new Uint8Array(await file.arrayBuffer());
  const type = sniffExpenseType(bytes, file);
  if (!type) throw new Error("That file type is not allowed.");
  await ensureExpenseFileBucket();
  const ext = EXPENSE_EXTENSIONS[type] || file.name.split(".").pop()?.toLowerCase() || "bin";
  const id = crypto.randomUUID();
  const objectPath = `expenses/${id}.${ext}`;
  const uploaded = await storageFetch(`/object/${EXPENSE_FILE_BUCKET}/${objectPath}`, {
    method: "POST",
    headers: {
      "Content-Type": type,
      "x-upsert": "true",
      "cache-control": "private, max-age=3600",
    },
    body: bytes,
  });
  if (!uploaded.ok) {
    const detail = await uploaded.text();
    throw new Error(detail || "Could not upload file.");
  }
  return {
    id,
    path: objectPath,
    name: file.name.replace(/[\r\n"]/g, "").slice(0, 180) || `file.${ext}`,
    size: file.size,
    type,
  };
}

export async function removeExpenseFile(path: string | null | undefined) {
  if (!path || path.includes("..") || !path.startsWith("expenses/")) return;
  const response = await storageFetch(`/object/${EXPENSE_FILE_BUCKET}`, {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prefixes: [path] }),
  });
  if (!response.ok && response.status !== 404) {
    const detail = await response.text();
    throw new Error(detail || "Could not remove file.");
  }
}

export async function fetchExpenseFile(path: string) {
  if (!path || path.includes("..") || !path.startsWith("expenses/")) {
    throw new Error("Invalid file path.");
  }
  const response = await storageFetch(`/object/${EXPENSE_FILE_BUCKET}/${path}`);
  if (!response.ok) {
    const detail = await response.text();
    throw new Error(detail || "Could not read file.");
  }
  return response;
}
