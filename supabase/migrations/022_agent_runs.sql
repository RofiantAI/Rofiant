create table if not exists agent_runs (
  id uuid primary key default gen_random_uuid(),
  agent_id uuid references agents on delete cascade not null,
  user_id uuid references auth.users on delete cascade not null,
  task text not null default '',
  status text not null default 'completed' check (status in ('completed', 'failed')),
  steps jsonb not null default '[]',
  output text,
  created_at timestamptz default now() not null
);

create index if not exists agent_runs_agent_id_idx on agent_runs (agent_id, created_at desc);
create index if not exists agent_runs_user_id_idx on agent_runs (user_id, created_at desc);

alter table agent_runs enable row level security;

create policy "Users own agent runs"
  on agent_runs for all
  using (auth.uid() = user_id);
