-- Milestone 4: admin role. Run in Supabase > SQL Editor, after 03-orders-rls.sql.

-- 4.1 Profiles: one row per user, with a role (on delete cascade: deleting a user removes the profile)
create table profiles (
  id uuid primary key references auth.users on delete cascade,
  email text,
  role text not null default 'user' check (role in ('user', 'admin'))
);
alter table profiles enable row level security;

-- No insert / update policy: nobody can create a profile or change a role from the front
create policy "read own profile" on profiles
  for select using (auth.uid() = id);

-- "Is the current user an admin?" written once, reused by every admin policy.
-- security definer: reads profiles without going through its RLS. Needed for the
-- "admin reads profiles" policy below, which would otherwise query itself (infinite recursion).
create function public.is_admin() returns boolean
  language sql stable security definer set search_path = ''
  as $$
    select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin')
  $$;

-- The admin manages the catalogue (select, insert, update, delete):
create policy "admin manages products" on products
  for all using (public.is_admin()) with check (public.is_admin());

-- The admin reads all orders, their lines and the customers' emails:
create policy "admin reads orders" on orders
  for select using (public.is_admin());
create policy "admin reads order items" on order_items
  for select using (public.is_admin());
create policy "admin reads profiles" on profiles
  for select using (public.is_admin());

-- Bonus: profile created automatically on sign up
create function public.handle_new_user() returns trigger
  language plpgsql security definer set search_path = ''
  as $$
  begin
    insert into public.profiles (id, email) values (new.id, new.email);
    return new;
  end
  $$;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Profiles for the users created before the trigger existed
insert into profiles (id, email)
  select id, email from auth.users
  on conflict (id) do nothing;

-- Milestone 3 hardening: a customer can only create a "pending" order
-- (the TP policy let anyone insert an order already "paid" or "shipped")
drop policy "insert own orders" on orders;
create policy "insert own orders" on orders
  for insert with check (auth.uid() = user_id and status = 'pending');

-- Then name yourself admin (the SQL editor bypasses RLS), with the email of your account:
-- update profiles set role = 'admin' where email = 'vous@exemple.fr';
