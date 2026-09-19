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
const password = process.env.DB_PASSWORD;
if (!url || !password) {
  console.error("Missing NEXT_PUBLIC_SUPABASE_URL or DB_PASSWORD");
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

const schema = readFileSync(join(root, "supabase/schema.sql"), "utf8");
const marker = "alter table public.store_settings add column if not exists dropship_enabled";
const start = schema.indexOf(marker);
if (start === -1) {
  console.error("dropship SQL not found");
  process.exit(1);
}
const end = schema.indexOf("\n\ninsert into public.store_settings", start);
const sql = schema.slice(start, end === -1 ? undefined : end);
const db = await connect();
await db.query(sql);
await db.query("notify pgrst, 'reload schema'");
await db.end();
console.log("dropship columns applied");
