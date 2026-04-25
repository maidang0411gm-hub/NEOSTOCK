-- Neostock Supabase schema
-- Run this in the Supabase SQL Editor.
-- Safe to run multiple times where possible.

create extension if not exists "pgcrypto";

-- =========================================================
-- products
-- =========================================================
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  sku text not null,
  name text not null,
  category text not null default '',
  variant text not null default '',
  quantity integer not null default 0,
  min_stock integer not null default 0,
  recommended_stock integer not null default 0,
  price numeric(14,2) not null default 0,
  cost_price numeric(14,2) not null default 0,
  image_url text not null default '',
  note text not null default '',
  last_updated timestamptz not null default now(),
  sort_order integer not null default 0,
  is_header boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_name_not_blank check (char_length(trim(name)) > 0),
  constraint products_sku_valid check (
    is_header = true or char_length(trim(sku)) > 0
  ),
  constraint products_quantity_non_negative check (quantity >= 0),
  constraint products_min_stock_non_negative check (min_stock >= 0),
  constraint products_recommended_stock_non_negative check (recommended_stock >= 0),
  constraint products_price_non_negative check (price >= 0),
  constraint products_cost_price_non_negative check (cost_price >= 0)
);

create unique index if not exists products_user_id_sku_variant_key
  on public.products (user_id, sku, variant)
  where is_header = false;

create index if not exists products_user_id_sort_order_idx
  on public.products (user_id, sort_order);

create index if not exists products_user_id_updated_idx
  on public.products (user_id, last_updated desc);

-- =========================================================
-- transactions
-- =========================================================
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  product_id uuid,
  product_sku text not null default '',
  product_name text not null,
  product_image_url text not null default '',
  type text not null,
  quantity integer not null,
  timestamp timestamptz not null default now(),
  note text not null default '',
  order_number text,
  order_source text,
  shipping_code text,
  price numeric(14,2),
  total_price numeric(14,2),
  payment_method text,
  batch_id text,
  batch_name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_product_name_not_blank check (char_length(trim(product_name)) > 0),
  constraint transactions_type_valid check (type in ('in', 'out')),
  constraint transactions_quantity_positive check (quantity > 0),
  constraint transactions_price_non_negative check (price is null or price >= 0),
  constraint transactions_total_price_non_negative check (total_price is null or total_price >= 0),
  constraint transactions_order_source_valid check (
    order_source is null or order_source in ('direct', 'online')
  ),
  constraint transactions_payment_method_valid check (
    payment_method is null or payment_method in ('cash', 'transfer')
  )
);

create index if not exists transactions_user_id_timestamp_idx
  on public.transactions (user_id, timestamp desc);

create index if not exists transactions_user_id_product_id_idx
  on public.transactions (user_id, product_id);

create index if not exists transactions_user_id_order_number_idx
  on public.transactions (user_id, order_number);

create index if not exists transactions_user_id_batch_id_idx
  on public.transactions (user_id, batch_id);

-- =========================================================
-- updated_at trigger
-- =========================================================
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists set_products_updated_at on public.products;
create trigger set_products_updated_at
before update on public.products
for each row
execute function public.set_updated_at();

drop trigger if exists set_transactions_updated_at on public.transactions;
create trigger set_transactions_updated_at
before update on public.transactions
for each row
execute function public.set_updated_at();

-- =========================================================
-- RLS
-- =========================================================
alter table public.products enable row level security;
alter table public.transactions enable row level security;

drop policy if exists "products_select_own" on public.products;
create policy "products_select_own"
on public.products
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "products_insert_own" on public.products;
create policy "products_insert_own"
on public.products
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "products_update_own" on public.products;
create policy "products_update_own"
on public.products
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "products_delete_own" on public.products;
create policy "products_delete_own"
on public.products
for delete
to authenticated
using (auth.uid() = user_id);

drop policy if exists "transactions_select_own" on public.transactions;
create policy "transactions_select_own"
on public.transactions
for select
to authenticated
using (auth.uid() = user_id);

drop policy if exists "transactions_insert_own" on public.transactions;
create policy "transactions_insert_own"
on public.transactions
for insert
to authenticated
with check (auth.uid() = user_id);

drop policy if exists "transactions_update_own" on public.transactions;
create policy "transactions_update_own"
on public.transactions
for update
to authenticated
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists "transactions_delete_own" on public.transactions;
create policy "transactions_delete_own"
on public.transactions
for delete
to authenticated
using (auth.uid() = user_id);

-- =========================================================
-- Optional storage bucket for product images
-- =========================================================
insert into storage.buckets (id, name, public)
values ('products', 'products', true)
on conflict (id) do nothing;

drop policy if exists "products_bucket_public_read" on storage.objects;
create policy "products_bucket_public_read"
on storage.objects
for select
to public
using (bucket_id = 'products');

drop policy if exists "products_bucket_owner_insert" on storage.objects;
create policy "products_bucket_owner_insert"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'products'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "products_bucket_owner_update" on storage.objects;
create policy "products_bucket_owner_update"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'products'
  and (storage.foldername(name))[1] = auth.uid()::text
)
with check (
  bucket_id = 'products'
  and (storage.foldername(name))[1] = auth.uid()::text
);

drop policy if exists "products_bucket_owner_delete" on storage.objects;
create policy "products_bucket_owner_delete"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'products'
  and (storage.foldername(name))[1] = auth.uid()::text
);

-- =========================================================
-- Notes
-- =========================================================
-- 1. product_id in transactions is intentionally nullable so old history
--    can remain even if a product is deleted later.
-- 2. The app stores a denormalized snapshot of product name / sku / image
--    in transactions, so history still renders correctly.
