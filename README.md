# qcommerce

Standalone Next.js 16 storefront + admin. Products, categories, orders, customers, and newsletter live in **Supabase**. There is no local demo store.

English + Arabic (RTL) and light + dark mode are built in. Switchers live in the gold top bar.

## Rebrand for a new client

Edit **one file**: `theme.config.ts`

## Run locally

```bash
cd qcommerce
cp .env.example .env.local
# fill in your Supabase URL, publishable key, and secret key
npm install
npm run db:migrate
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

## Supabase

`.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
SUPABASE_SECRET_KEY=sb_secret_...
DB_PASSWORD=your-database-password
ADMIN_EMAIL=admin@voombaza.com
ADMIN_PASSWORD=admin123
RESEND_API_KEY=re_...
EMAIL_FROM=Voombaza <onboarding@resend.dev>
NEXT_PUBLIC_SITE_URL=https://your-store-domain.com

# Optional. Dropshipping stays hidden until the client is ready.
# ALIEXPRESS_APP_KEY=
# ALIEXPRESS_APP_SECRET=
# TEMU_APP_KEY=
# TEMU_APP_SECRET=
```

`npm run db:migrate` applies `supabase/schema.sql` over Postgres (`DB_PASSWORD`) and upserts the catalogue. After that, manage products from `/admin`.
