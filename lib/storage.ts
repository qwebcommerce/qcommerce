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
