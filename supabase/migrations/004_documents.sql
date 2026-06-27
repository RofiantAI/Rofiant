create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  type text not null,
  size bigint not null default 0,
  storage_path text not null,
  status text not null default 'indexed' check (status in ('uploading', 'indexed', 'failed')),
  created_at timestamptz default now() not null
);

create index if not exists documents_user_id_idx on documents (user_id, created_at desc);

alter table documents enable row level security;

create policy "Users own documents"
  on documents for all
  using (auth.uid() = user_id);

-- Storage buckets
insert into storage.buckets (id, name, public, file_size_limit)
  values ('documents', 'documents', false, 52428800)
  on conflict (id) do nothing;

insert into storage.buckets (id, name, public, file_size_limit)
  values ('voice', 'voice', false, 524288000)
  on conflict (id) do nothing;

-- Storage policies for documents bucket
create policy "Users upload own documents"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users read own documents"
  on storage.objects for select to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own documents"
  on storage.objects for delete to authenticated
  using (bucket_id = 'documents' and (storage.foldername(name))[1] = auth.uid()::text);

-- Storage policies for voice bucket
create policy "Users upload own voice"
  on storage.objects for insert to authenticated
  with check (bucket_id = 'voice' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users read own voice"
  on storage.objects for select to authenticated
  using (bucket_id = 'voice' and (storage.foldername(name))[1] = auth.uid()::text);

create policy "Users delete own voice"
  on storage.objects for delete to authenticated
  using (bucket_id = 'voice' and (storage.foldername(name))[1] = auth.uid()::text);
