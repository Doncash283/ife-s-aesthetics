-- ============================================
-- IFE AESTHETICS PRODUCT DATABASE
-- ============================================

create extension if not exists pgcrypto;


-- ============================================
-- PRODUCTS
-- ============================================

create table if not exists public.products (

  id uuid primary key
    default gen_random_uuid(),

  name text not null,

  description text
    default '',

  price numeric(12,2)
    not null
    default 0,

  category text
    not null,

  image_url text,

  active boolean
    not null
    default true,

  created_at timestamptz
    not null
    default now()

);


-- ============================================
-- CATEGORY VALIDATION
-- ============================================

alter table public.products
drop constraint if exists products_category_check;


alter table public.products
add constraint products_category_check
check (
  category in (
    'Beauty',
    'Fashion',
    'Accessories',
    'Home Decor'
  )
);


-- ============================================
-- ENABLE SECURITY
-- ============================================

alter table public.products
enable row level security;


-- ============================================
-- PUBLIC PRODUCT VIEW
-- ============================================

drop policy if exists
"Public can view active products"
on public.products;


create policy
"Public can view active products"

on public.products

for select

to anon, authenticated

using (
  active = true
);


-- ============================================
-- IMPORTANT
-- ============================================

-- DO NOT create public INSERT,
-- UPDATE or DELETE policies.

-- The admin dashboard will later use
-- Supabase Authentication and secure
-- Row Level Security policies.
