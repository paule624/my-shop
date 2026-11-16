-- Bonus (milestone 4): product image upload. Run in Supabase > SQL Editor, after 04-admin.sql.

-- Public bucket: anyone can display an image from its URL (like the catalogue, readable by everyone).
-- The server enforces the limits, whatever the front sends: 1 MB max, images only.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('product-images', 'product-images', true, 1048576,
        array['image/webp', 'image/jpeg', 'image/png', 'image/avif']);

-- Storage files are rows of storage.objects, protected by RLS like any table:
-- only an admin can add a file to this bucket (same is_admin() as the catalogue policies).
create policy "admin uploads product images" on storage.objects
  for insert to authenticated
  with check (bucket_id = 'product-images' and public.is_admin());
