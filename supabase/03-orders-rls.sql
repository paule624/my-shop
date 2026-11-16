-- Milestone 3: privacy contract. Run in Supabase > SQL Editor.
-- Policies are the security: the front-end never filters on user_id.

-- Everyone reads only their own orders:
create policy "read own orders" on orders
  for select using (auth.uid() = user_id);

-- And only creates orders in their own name:
create policy "insert own orders" on orders
  for insert with check (auth.uid() = user_id);

-- Order lines follow their order:
create policy "read own order items" on order_items
  for select using (
    exists (select 1 from orders o
            where o.id = order_id and o.user_id = auth.uid())
  );

create policy "insert own order items" on order_items
  for insert with check (
    exists (select 1 from orders o
            where o.id = order_id and o.user_id = auth.uid())
  );
