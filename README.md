# qcommerce

Standalone Next.js 16 storefront + admin, ported from the Voombaza Shopify theme. TypeScript throughout. Supabase is the production backend; a local JSON file store is used when Supabase env vars are empty so the site runs immediately.

English + Arabic (RTL) and light + dark mode are built in. Switchers live in the gold top bar.

## Rebrand for a new client

Edit **one file**: `theme.config.ts`

That file owns:

- Brand name, tagline, description, Instagram
- Light and dark color palettes (injected as CSS variables)
- Currency, shipping threshold, promo, countries, payments
- Nav, announcement, hero, marquee, press, Instagram, category names
- About / privacy / terms copy and FAQs

UI chrome (buttons, labels, errors) lives in `lib/i18n/en.ts` and `lib/i18n/ar.ts`. You only touch those if you add new interface strings.

## Run locally

```bash
cd qcommerce
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

Admin: [http://localhost:3000/admin](http://localhost:3000/admin)

- Email: `admin@voombaza.com`
- Password: `admin123`

Demo customers (storefront login): `aisha@example.com` / `password123`

## What is included

**Storefront** (Shopify pages, without Shopify)

- Home (hero, marquee, categories, products, press, UGC, newsletter)
- Shop + category filters, product detail, search, wishlist
- Cart drawer, cart page, checkout (creates a real order)
- Account register / login / order history
- About, contact, FAQ, privacy, terms
- Language (EN / عربي) and theme (light / dark) switchers

**Admin**

- Same language and theme switchers in the top bar
- Dashboard (revenue, orders, products, customers, low stock)
- Products: create, edit, delete
- Orders: list + status + customer/shipping details
- Customers: list + order history
- Categories: add / delete

## Supabase (optional)

The app uses `.data/store.json` until these are set in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
ADMIN_EMAIL=admin@voombaza.com
ADMIN_PASSWORD=admin123
```

Then in the Supabase SQL editor run:

1. `supabase/schema.sql`
2. `supabase/seed.sql`

Restart the Next.js server. Catalogue, orders, customers, and newsletter writes go to Supabase. Admin login still uses `ADMIN_EMAIL` / `ADMIN_PASSWORD`.
