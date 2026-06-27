create table if not exists voice_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  duration text not null default '—',
  storage_path text not null,
  size bigint not null default 0,
  status text not null default 'processing' check (status in ('processing', 'done', 'failed')),
  created_at timestamptz default now() not null
);

create index if not exists voice_records_user_id_idx on voice_records (user_id, created_at desc);

alter table voice_records enable row level security;

create policy "Users own voice_records"
  on voice_records for all
  using (auth.uid() = user_id);
