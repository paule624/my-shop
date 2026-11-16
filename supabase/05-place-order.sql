-- Bonus (milestone 3): atomic checkout. Run in Supabase > SQL Editor, after 04-admin.sql.
-- One function call = one transaction: the order and all its lines are created, or nothing is.
-- (With two inserts from the front, a failure on the lines left an empty order behind.)

create function public.place_order(items jsonb)
returns uuid
language plpgsql
-- Runs with the caller's rights: the milestone 3/4 RLS policies still decide what is allowed
security invoker
set search_path = ''
as $$
declare
  new_order_id uuid;
begin
  if jsonb_array_length(items) = 0 then
    raise exception 'Le panier est vide.';
  end if;

  -- Stock is checked by the server at order time, not trusted from the browser
  if exists (
    select 1
    from jsonb_array_elements(items) as item
    left join public.products p on p.id = (item ->> 'product_id')::uuid
    where p.id is null or not p.in_stock
  ) then
    raise exception 'Un produit du panier n''est plus disponible.';
  end if;

  -- user_id comes from the session (auth.uid()), never from the request
  insert into public.orders (user_id) values (auth.uid())
  returning id into new_order_id;

  insert into public.order_items (order_id, product_id, quantity)
  select new_order_id, (item ->> 'product_id')::uuid, (item ->> 'quantity')::int
  from jsonb_array_elements(items) as item;

  return new_order_id;
end;
$$;
