import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import pg from "pg";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadEnv() {
  const text = readFileSync(join(root, ".env.local"), "utf8");
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#") || !line.includes("=")) continue;
    const idx = line.indexOf("=");
    let value = line.slice(idx + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[line.slice(0, idx).trim()] = value;
  }
}

loadEnv();

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SECRET_KEY;
const password = process.env.DB_PASSWORD;
if (!url || !key) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SECRET_KEY");
  process.exit(1);
}
if (!password) {
  console.error("Missing DB_PASSWORD");
  process.exit(1);
}

const ref = new URL(url).hostname.split(".")[0];
const ssl = { rejectUnauthorized: false };

const targets = [
  { host: `db.${ref}.supabase.co`, port: 5432, user: "postgres" },
  { host: `db.${ref}.supabase.co`, port: 6543, user: "postgres" },
  ...[
    "aws-0-eu-central-1",
    "aws-0-eu-west-1",
    "aws-0-eu-west-2",
    "aws-0-us-east-1",
    "aws-1-us-east-1",
    "aws-0-us-west-1",
    "aws-0-ap-southeast-1",
  ].flatMap((region) => [
    { host: `${region}.pooler.supabase.com`, port: 6543, user: `postgres.${ref}` },
    { host: `${region}.pooler.supabase.com`, port: 5432, user: `postgres.${ref}` },
  ]),
];

async function connect() {
  let lastError = "none";
  for (const target of targets) {
    const client = new pg.Client({
      host: target.host,
      port: target.port,
      user: target.user,
      password,
      database: "postgres",
      ssl,
      connectionTimeoutMillis: 8000,
    });
    try {
      await client.connect();
      console.log(`connected ${target.host}:${target.port}`);
      return client;
    } catch (error) {
      lastError = error.code || error.message || "fail";
      try {
        await client.end();
      } catch {
        /* ignore */
      }
    }
  }
  console.error("Could not connect to Postgres:", lastError);
  process.exit(1);
}

const db = await connect();
await db.query(readFileSync(join(root, "supabase/schema.sql"), "utf8"));
await db.query("notify pgrst, 'reload schema'");
console.log("schema applied");

const img = (id, w = 900) =>
  `https://images.unsplash.com/photo-${id}?w=${w}&q=80&fit=crop&crop=top`;

const desc = (name, cat) =>
  `${name} — a Voombaza staple in our ${cat} lineup. Cut for the Gulf climate, finished with premium fabrics, and designed to move from street to evening without effort. Machine washable. Ships across the GCC.`;

const categories = [
  { name: "T-Shirts", name_ar: "تيشيرتات", slug: "t-shirts", subtitle: "Basics & Beyond", subtitle_ar: "الأساسيات وما بعدها", image: img("1521572163474-6864f9cf17ab", 700), sort_order: 1 },
  { name: "Shirts", name_ar: "قمصان", slug: "shirts", subtitle: "Smart Casual", subtitle_ar: "كاجوال أنيق", image: img("1596755094514-f87e34085b2c", 700), sort_order: 2 },
  { name: "Joggers", name_ar: "جوغر", slug: "joggers", subtitle: "Street Ready", subtitle_ar: "جاهز للشارع", image: img("1515886657613-9f3515b0c78f", 700), sort_order: 3 },
  { name: "Shorts", name_ar: "شورتات", slug: "shorts", subtitle: "Summer Essentials", subtitle_ar: "أساسيات الصيف", image: img("1562157873-818bc0726f68", 700), sort_order: 4 },
  { name: "Hoodies", name_ar: "هوديز", slug: "hoodies", subtitle: "Layer Up", subtitle_ar: "طبقات إضافية", image: img("1591047139829-d91aecb6caea", 700), sort_order: 5 },
  { name: "Activewear", name_ar: "ملابس رياضية", slug: "activewear", subtitle: "Train in Style", subtitle_ar: "تمرّن بأناقة", image: img("1584917865442-de89df76afd3", 700), sort_order: 6 },
  { name: "Accessories", name_ar: "إكسسوارات", slug: "accessories", subtitle: "Finish the Look", subtitle_ar: "أكمل الإطلالة", image: img("1553062407-98eeb64c6a62", 700), sort_order: 7 },
  { name: "New Arrivals", name_ar: "وصل حديثاً", slug: "new-arrivals", subtitle: "Just Landed", subtitle_ar: "وصل للتو", image: img("1529139574466-a303027c1d8b", 700), sort_order: 8 },
];

const products = [
  { name: "Classic Oversized Tee", slug: "classic-oversized-tee", description: desc("Classic Oversized Tee", "T-Shirts"), category: "T-Shirts", category_slug: "t-shirts", price: 89, compare_at_price: null, badge: "BESTSELLER", images: [img("1521572163474-6864f9cf17ab")], sku: "VB-TS-001", sizes: ["S", "M", "L", "XL"], colors: ["Black", "White", "Sand"], stock: 42, status: "active", created_at: "2026-08-12T10:00:00.000Z" },
  { name: "Graphic Street Tee", slug: "graphic-street-tee", description: desc("Graphic Street Tee", "T-Shirts"), category: "T-Shirts", category_slug: "t-shirts", price: 99, compare_at_price: 139, badge: "SALE", images: [img("1583743814966-8936f5b7be1a")], sku: "VB-TS-002", sizes: ["S", "M", "L", "XL"], colors: ["Black", "Olive"], stock: 18, status: "active", created_at: "2026-08-14T10:00:00.000Z" },
  { name: "Drop Shoulder Tee", slug: "drop-shoulder-tee", description: desc("Drop Shoulder Tee", "T-Shirts"), category: "T-Shirts", category_slug: "t-shirts", price: 109, compare_at_price: null, badge: "NEW", images: [img("1529139574466-a303027c1d8b")], sku: "VB-TS-003", sizes: ["S", "M", "L", "XL"], colors: ["Ivory", "Black"], stock: 30, status: "active", created_at: "2026-09-01T10:00:00.000Z" },
  { name: "Solid Crew Neck Tee", slug: "solid-crew-neck-tee", description: desc("Solid Crew Neck Tee", "T-Shirts"), category: "T-Shirts", category_slug: "t-shirts", price: 79, compare_at_price: null, badge: null, images: [img("1503341338985-95f13b926738")], sku: "VB-TS-004", sizes: ["S", "M", "L", "XL", "XXL"], colors: ["White", "Navy"], stock: 55, status: "active", created_at: "2026-07-20T10:00:00.000Z" },
  { name: "Smart Oxford Shirt", slug: "smart-oxford-shirt", description: desc("Smart Oxford Shirt", "Shirts"), category: "Shirts", category_slug: "shirts", price: 159, compare_at_price: null, badge: null, images: [img("1596755094514-f87e34085b2c")], sku: "VB-SH-001", sizes: ["S", "M", "L", "XL"], colors: ["White", "Sky"], stock: 22, status: "active", created_at: "2026-08-02T10:00:00.000Z" },
  { name: "Relaxed Linen Shirt", slug: "relaxed-linen-shirt", description: desc("Relaxed Linen Shirt", "Shirts"), category: "Shirts", category_slug: "shirts", price: 179, compare_at_price: null, badge: "NEW", images: [img("1542271026-7eec264c27ff")], sku: "VB-SH-002", sizes: ["S", "M", "L", "XL"], colors: ["Sand", "Olive"], stock: 16, status: "active", created_at: "2026-09-04T10:00:00.000Z" },
  { name: "Structured Overshirt", slug: "structured-overshirt", description: desc("Structured Overshirt", "Shirts"), category: "Shirts", category_slug: "shirts", price: 249, compare_at_price: null, badge: "BESTSELLER", images: [img("1584917865442-de89df76afd3")], sku: "VB-SH-003", sizes: ["M", "L", "XL"], colors: ["Khaki", "Black"], stock: 11, status: "active", created_at: "2026-08-18T10:00:00.000Z" },
  { name: "Cuban Collar Shirt", slug: "cuban-collar-shirt", description: desc("Cuban Collar Shirt", "Shirts"), category: "Shirts", category_slug: "shirts", price: 199, compare_at_price: 259, badge: "SALE", images: [img("1603252109303-2751441dd157")], sku: "VB-SH-004", sizes: ["S", "M", "L", "XL"], colors: ["Cream", "Black"], stock: 9, status: "active", created_at: "2026-08-22T10:00:00.000Z" },
  { name: "Urban Cargo Jogger", slug: "urban-cargo-jogger", description: desc("Urban Cargo Jogger", "Joggers"), category: "Joggers", category_slug: "joggers", price: 199, compare_at_price: 269, badge: "SALE", images: [img("1515886657613-9f3515b0c78f")], sku: "VB-JG-001", sizes: ["S", "M", "L", "XL"], colors: ["Black", "Olive"], stock: 24, status: "active", created_at: "2026-08-08T10:00:00.000Z" },
  { name: "Tech Fleece Jogger", slug: "tech-fleece-jogger", description: desc("Tech Fleece Jogger", "Joggers"), category: "Joggers", category_slug: "joggers", price: 229, compare_at_price: null, badge: "NEW", images: [img("1574680178050-55c6a6a96e0a")], sku: "VB-JG-002", sizes: ["S", "M", "L", "XL"], colors: ["Charcoal", "Navy"], stock: 14, status: "active", created_at: "2026-09-06T10:00:00.000Z" },
  { name: "Slim Tapered Sweatpant", slug: "slim-tapered-sweatpant", description: desc("Slim Tapered Sweatpant", "Joggers"), category: "Joggers", category_slug: "joggers", price: 189, compare_at_price: null, badge: null, images: [img("1556905055-8f358a7a47b2")], sku: "VB-JG-003", sizes: ["S", "M", "L", "XL"], colors: ["Black", "Grey"], stock: 20, status: "active", created_at: "2026-07-28T10:00:00.000Z" },
  { name: "Cargo Utility Shorts", slug: "cargo-utility-shorts", description: desc("Cargo Utility Shorts", "Shorts"), category: "Shorts", category_slug: "shorts", price: 139, compare_at_price: null, badge: "NEW", images: [img("1562157873-818bc0726f68")], sku: "VB-ST-001", sizes: ["S", "M", "L", "XL"], colors: ["Khaki", "Black"], stock: 27, status: "active", created_at: "2026-09-02T10:00:00.000Z" },
  { name: "Athletic Training Shorts", slug: "athletic-training-shorts", description: desc("Athletic Training Shorts", "Shorts"), category: "Shorts", category_slug: "shorts", price: 119, compare_at_price: 159, badge: "SALE", images: [img("1552902865-b72c031ac5ea")], sku: "VB-ST-002", sizes: ["S", "M", "L", "XL"], colors: ["Black", "Navy"], stock: 33, status: "active", created_at: "2026-08-05T10:00:00.000Z" },
  { name: "Drop Shoulder Hoodie", slug: "drop-shoulder-hoodie", description: desc("Drop Shoulder Hoodie", "Hoodies"), category: "Hoodies", category_slug: "hoodies", price: 259, compare_at_price: 349, badge: "TRENDING", images: [img("1591047139829-d91aecb6caea")], sku: "VB-HD-001", sizes: ["S", "M", "L", "XL"], colors: ["Black", "Stone"], stock: 13, status: "active", created_at: "2026-08-25T10:00:00.000Z" },
  { name: "Premium Zip-Up Hoodie", slug: "premium-zip-up-hoodie", description: desc("Premium Zip-Up Hoodie", "Hoodies"), category: "Hoodies", category_slug: "hoodies", price: 299, compare_at_price: null, badge: null, images: [img("1620799140408-edc6dcb6d633")], sku: "VB-HD-002", sizes: ["M", "L", "XL"], colors: ["Grey", "Black"], stock: 8, status: "active", created_at: "2026-07-15T10:00:00.000Z" },
];

for (const row of categories) {
  await db.query(
    `insert into public.categories (name, name_ar, slug, subtitle, subtitle_ar, image, sort_order)
     values ($1, $2, $3, $4, $5, $6, $7)
     on conflict (slug) do update set
       name = excluded.name,
       name_ar = case when public.categories.name_ar = '' then excluded.name_ar else public.categories.name_ar end,
       subtitle = excluded.subtitle,
       subtitle_ar = case when public.categories.subtitle_ar = '' then excluded.subtitle_ar else public.categories.subtitle_ar end,
       sort_order = excluded.sort_order`,
    [row.name, row.name_ar, row.slug, row.subtitle, row.subtitle_ar, row.image, row.sort_order],
  );
}

for (const row of products) {
  await db.query(
    `insert into public.products (
       name, slug, description, category, category_slug, price, compare_at_price, badge,
       images, sku, sizes, colors, stock, status, created_at
     ) values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15)
     on conflict (slug) do update set
       name = excluded.name,
       description = excluded.description,
       category = excluded.category,
       category_slug = excluded.category_slug,
       price = excluded.price,
       compare_at_price = excluded.compare_at_price,
       badge = excluded.badge,
       images = excluded.images,
       sku = excluded.sku,
       sizes = excluded.sizes,
       colors = excluded.colors,
       stock = excluded.stock,
       status = excluded.status`,
    [
      row.name,
      row.slug,
      row.description,
      row.category,
      row.category_slug,
      row.price,
      row.compare_at_price,
      row.badge,
      row.images,
      row.sku,
      row.sizes,
      row.colors,
      row.stock,
      row.status,
      row.created_at,
    ],
  );
}

const counts = await db.query(
  `select 'categories' as name, count(*)::int as n from public.categories
   union all select 'products', count(*)::int from public.products
   union all select 'customers', count(*)::int from public.customers
   union all select 'orders', count(*)::int from public.orders
   union all select 'newsletter', count(*)::int from public.newsletter
   order by 1`,
);
await db.end();
console.log("catalogue upserted");
console.log(counts.rows.map((row) => `${row.name}:${row.n}`).join(" "));

const sb = createClient(url, key, {
  auth: { persistSession: false, autoRefreshToken: false },
  global: {
    fetch: (input, init) => {
      const headers = new Headers(init?.headers);
      headers.set("apikey", key);
      if (key.startsWith("sb_publishable_") || key.startsWith("sb_secret_")) {
        headers.delete("Authorization");
      }
      return fetch(input, { ...init, headers });
    },
  },
});

await new Promise((resolve) => setTimeout(resolve, 1500));
const { error } = await sb.from("products").select("id").limit(1);
if (error) console.log("api still warming:", error.code || error.message);
else console.log("api ready");
