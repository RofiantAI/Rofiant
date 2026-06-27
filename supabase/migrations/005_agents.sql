create table if not exists agents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  name text not null,
  description text not null default '',
  status text not null default 'active' check (status in ('active', 'paused')),
  runs integer not null default 0,
  created_at timestamptz default now() not null
);

create index if not exists agents_user_id_idx on agents (user_id, created_at desc);

alter table agents enable row level security;

create policy "Users own agents"
  on agents for all
  using (auth.uid() = user_id);
