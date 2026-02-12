-- Storage RLS policies (run as supabase_storage_admin / SQL Editor)

alter table storage.objects enable row level security;

drop policy if exists "Storage service role access" on storage.objects;
create policy "Storage service role access"
  on storage.objects
  for all
  using (auth.role() = 'service_role')
  with check (auth.role() = 'service_role');

drop policy if exists "Users can read own storage objects" on storage.objects;
create policy "Users can read own storage objects"
  on storage.objects
  for select
  using (
    bucket_id in ('media', 'avatars', 'reports', 'camps')
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Users can upload to own storage folder" on storage.objects;
create policy "Users can upload to own storage folder"
  on storage.objects
  for insert
  with check (
    bucket_id in ('media', 'avatars', 'reports', 'camps')
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Users can update own storage objects" on storage.objects;
create policy "Users can update own storage objects"
  on storage.objects
  for update
  using (
    bucket_id in ('media', 'avatars', 'reports', 'camps')
    and split_part(name, '/', 1) = auth.uid()::text
  )
  with check (
    bucket_id in ('media', 'avatars', 'reports', 'camps')
    and split_part(name, '/', 1) = auth.uid()::text
  );

drop policy if exists "Users can delete own storage objects" on storage.objects;
create policy "Users can delete own storage objects"
  on storage.objects
  for delete
  using (
    bucket_id in ('media', 'avatars', 'reports', 'camps')
    and split_part(name, '/', 1) = auth.uid()::text
  );
