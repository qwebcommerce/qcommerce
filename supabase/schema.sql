-- Voombaza / qcommerce schema
-- Idempotent. Run in the Supabase SQL editor or via npm run db:migrate.

create extension if not exists "pgcrypto";

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  parent_id uuid references public.categories(id) on delete restrict,
  name text not null,
  name_ar text not null default '',
  slug text not null unique,
  subtitle text default '',
  subtitle_ar text not null default '',
  image text not null default '',
  sort_order int not null default 0
);

alter table public.categories add column if not exists parent_id uuid references public.categories(id) on delete restrict;
alter table public.categories add column if not exists name_ar text not null default '';
alter table public.categories add column if not exists subtitle_ar text not null default '';
alter table public.categories alter column image set default '';
alter table public.categories alter column image drop not null;

update public.categories set name_ar = 'تيشيرتات', subtitle_ar = 'الأساسيات وما بعدها' where slug = 't-shirts' and name_ar = '';
update public.categories set name_ar = 'قمصان', subtitle_ar = 'كاجوال أنيق' where slug = 'shirts' and name_ar = '';
update public.categories set name_ar = 'جوغر', subtitle_ar = 'جاهز للشارع' where slug = 'joggers' and name_ar = '';
update public.categories set name_ar = 'شورتات', subtitle_ar = 'أساسيات الصيف' where slug = 'shorts' and name_ar = '';
update public.categories set name_ar = 'هوديز', subtitle_ar = 'طبقات إضافية' where slug = 'hoodies' and name_ar = '';
update public.categories set name_ar = 'ملابس رياضية', subtitle_ar = 'تمرّن بأناقة' where slug = 'activewear' and name_ar = '';
update public.categories set name_ar = 'إكسسوارات', subtitle_ar = 'أكمل الإطلالة' where slug = 'accessories' and name_ar = '';
update public.categories set name_ar = 'وصل حديثاً', subtitle_ar = 'وصل للتو' where slug = 'new-arrivals' and name_ar = '';

create or replace function public.enforce_category_depth()
returns trigger
language plpgsql
as $$
begin
  if new.parent_id is not null then
    if new.id is not null and new.parent_id = new.id then
      raise exception 'A category cannot be its own parent';
    end if;
    if exists (
      select 1 from public.categories
      where id = new.parent_id and parent_id is not null
    ) then
      raise exception 'Subcategories cannot have their own subcategories';
    end if;
    if exists (
      select 1 from public.categories
      where parent_id = new.id
    ) then
      raise exception 'Move or delete subcategories before nesting this category';
    end if;
  end if;
  return new;
end;
$$;

drop trigger if exists categories_depth on public.categories;
create trigger categories_depth
  before insert or update of parent_id on public.categories
  for each row execute procedure public.enforce_category_depth();

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  name_ar text not null default '',
  slug text not null unique,
  description text default '',
  description_ar text not null default '',
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
  has_variants boolean not null default false,
  variants jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now()
);

alter table public.products add column if not exists name_ar text not null default '';
alter table public.products add column if not exists description_ar text not null default '';
alter table public.products add column if not exists has_variants boolean not null default false;
alter table public.products add column if not exists variants jsonb not null default '[]'::jsonb;

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  full_name text not null,
  phone text default '',
  role text not null default 'customer' check (role in ('customer', 'admin')),
  status text not null default 'active' check (status in ('active', 'blocked')),
  password_hash text,
  created_at timestamptz not null default now()
);

alter table public.customers add column if not exists status text not null default 'active';
alter table public.customers drop constraint if exists customers_status_check;
alter table public.customers add constraint customers_status_check check (status in ('active', 'blocked'));

create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  order_number text not null unique,
  customer_id uuid references public.customers(id) on delete set null,
  email text not null,
  customer_name text not null,
  status text not null default 'pending' check (
    status in ('pending', 'paid', 'processing', 'shipped', 'delivered', 'cancelled')
  ),
  payment_status text not null default 'unpaid' check (payment_status in ('unpaid', 'paid')),
  items jsonb not null default '[]',
  subtotal numeric(10,2) not null,
  shipping numeric(10,2) not null default 0,
  total numeric(10,2) not null,
  shipping_address jsonb not null default '{}',
  notes text default '',
  created_at timestamptz not null default now()
);

alter table public.orders add column if not exists payment_status text not null default 'unpaid';
alter table public.orders drop constraint if exists orders_payment_status_check;
alter table public.orders add constraint orders_payment_status_check check (payment_status in ('unpaid', 'paid'));
update public.orders set payment_status = 'paid' where status = 'paid' and payment_status <> 'paid';

create table if not exists public.newsletter (
  id uuid primary key default gen_random_uuid(),
  email text not null unique,
  created_at timestamptz not null default now()
);

create table if not exists public.store_settings (
  id text primary key default 'store',
  free_shipping_from numeric(10,2) not null default 500,
  shipping_fee numeric(10,2) not null default 25,
  return_days int not null default 14,
  promo_code text not null default 'VB20',
  promo_percent numeric(5,2) not null default 20,
  updated_at timestamptz not null default now()
);

alter table public.store_settings add column if not exists return_days int not null default 14;
alter table public.store_settings add column if not exists promo_code text not null default 'VB20';
alter table public.store_settings add column if not exists promo_percent numeric(5,2) not null default 20;

insert into public.store_settings (id, free_shipping_from, shipping_fee, return_days, promo_code, promo_percent)
values ('store', 500, 25, 14, 'VB20', 20)
on conflict (id) do nothing;

alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.newsletter enable row level security;
alter table public.store_settings enable row level security;

drop policy if exists "categories_read" on public.categories;
drop policy if exists "products_read" on public.products;
drop policy if exists "customers_self_read" on public.customers;
drop policy if exists "orders_self_read" on public.orders;
drop policy if exists "newsletter_insert" on public.newsletter;
drop policy if exists "store_settings_read" on public.store_settings;

create policy "categories_read" on public.categories for select using (true);
create policy "products_read" on public.products for select using (true);

-- Writes go through the secret key from Next.js server actions.
create policy "customers_self_read" on public.customers for select using (true);
create policy "orders_self_read" on public.orders for select using (true);
create policy "newsletter_insert" on public.newsletter for insert with check (true);
create policy "store_settings_read" on public.store_settings for select using (true);

create index if not exists categories_parent_id_idx on public.categories (parent_id);
create index if not exists products_category_slug_idx on public.products (category_slug);
create index if not exists products_status_idx on public.products (status);
create index if not exists orders_customer_id_idx on public.orders (customer_id);
create index if not exists orders_created_at_idx on public.orders (created_at desc);

grant usage on schema public to anon, authenticated, service_role;
grant select on table public.categories, public.products, public.store_settings to anon, authenticated;
grant all on table public.categories, public.products, public.customers, public.orders, public.newsletter, public.store_settings to postgres, service_role;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'category-images',
  'category-images',
  true,
  10485760,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif']
)
on conflict (id) do update set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "category_images_public_read" on storage.objects;
create policy "category_images_public_read"
  on storage.objects for select
  using (bucket_id = 'category-images');
