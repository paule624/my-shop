-- Milestone 1: tables + RLS. Run in Supabase > SQL Editor, before 02-seed-products.sql.
-- Adapted from the TP schema to the existing Product type: image_alt, category, badge, in_stock added.

create table products (
  id uuid primary key default gen_random_uuid(),
  slug text unique not null,
  name text not null,
  price numeric not null check (price >= 0),
  image_url text,
  image_alt text,
  description text,
  category text,
  badge text,
  in_stock boolean not null default true
);

create table orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete set null,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references orders on delete cascade,
  product_id uuid not null references products,
  quantity int not null default 1 check (quantity > 0)
);

-- RLS everywhere: without a policy, a table returns nothing and accepts no write
alter table products enable row level security;
alter table orders enable row level security;
alter table order_items enable row level security;

-- Products are readable by everyone, even anonymous visitors (read only: no write policy)
create policy "products are public"
  on products for select using (true);
