create table if not exists api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  key_value text not null,
  key_prefix text not null,
  created_at timestamptz default now() not null,
  last_used_at timestamptz
);

create index if not exists api_keys_user_id_idx on api_keys (user_id, created_at desc);

alter table api_keys enable row level security;

create policy "Users own api_keys"
  on api_keys for all
  using (auth.uid() = user_id);
