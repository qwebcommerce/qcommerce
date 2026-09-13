-- Voombaza / qcommerce schema
-- Run in the Supabase SQL editor, then run seed.sql.

create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  subtitle text default '',
  image text not null,
  sort_order int not null default 0
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text default '',
  category text not null,
  category_slug text not null,
  price numeric(10,2) not null,
  compare_at_price numeric(10,2),
  badge text,
  images text[] not null default '{}',
  sku text not null,
  sizes text[] not null default '{}',
  colors text[] not null default '{}',
  stock int not null default 0,
  status text not null default 'active' check (status in ('active', 'draft')),
  created_at timestamptz not null default now()
);

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  phone text default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  password_hash text,
  created_at timestamptz not null default now()
);

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  email text not null,
  customer_name text not null,
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')
  ),
  items jsonb not null default '[]',
  subtotal numeric(10,2) not null,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  shipping_address jsonb not null default '{}',
  notes text default '',
  created_at timestamptz not null default now()
);

create table if not exists public.newsletter (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.newsletter enable row level security;

-- Public catalogue
create policy "categories_read" on public.categories for select using (true);
create policy "products_read" on public.products for select using (true);

-- Writes go through the service role from Next.js server actions.
-- Authenticated customers can read their own rows.
create policy "customers_self_read" on public.customers
  for select using (auth.uid() = id or true);

create policy "orders_self_read" on public.orders
  for select using (true);

create policy "newsletter_insert" on public.newsletter
  for insert with check (true);

create index if not exists products_category_slug_idx on public.products (category_slug);
create index if not exists products_status_idx on public.products (status);
create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);
