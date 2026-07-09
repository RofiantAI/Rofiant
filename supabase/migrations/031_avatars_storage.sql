insert into storage.buckets (id, name, public, file_size_limit)
  values ('avatars', 'avatars', true, 5242880)
  on conflict (id) do nothing;

create policy "Users upload own avatars"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users update own avatars"
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own avatars"
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Avatars public read"
  on storage.objects for select
  using (bucket_id = 'avatars');
