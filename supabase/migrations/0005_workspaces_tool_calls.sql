-- Real agent tool execution: one sandbox-backed workspace per conversation,
-- and a log of every tool call made in it. See backend/app/agent/runner.py
-- and backend/app/services/workspace.py.

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  sandbox_id text not null,
  status text not null default 'active' check (status in ('active', 'stopped')),
  created_at timestamptz not null default now(),
  last_active_at timestamptz not null default now(),
  unique (conversation_id)
);

alter table public.workspaces enable row level security;

create policy "workspaces_select_own" on public.workspaces
  for select using (auth.uid() = user_id);

create policy "workspaces_insert_own" on public.workspaces
  for insert with check (auth.uid() = user_id);

create policy "workspaces_update_own" on public.workspaces
  for update using (auth.uid() = user_id);


create table public.tool_calls (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  tool_name text not null,
  arguments jsonb not null default '{}'::jsonb,
  result jsonb,
  status text not null check (status in ('completed', 'failed')),
  created_at timestamptz not null default now()
);

create index tool_calls_conversation_id_idx on public.tool_calls (conversation_id);

alter table public.tool_calls enable row level security;

-- tool_calls carries no user_id; ownership flows through the parent conversation.
create policy "tool_calls_select_own" on public.tool_calls
  for select using (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

create policy "tool_calls_insert_own" on public.tool_calls
  for insert with check (
    exists (
      select 1 from public.conversations c
      where c.id = conversation_id and c.user_id = auth.uid()
    )
  );

-- Same grant gotcha as 0003: RLS restricts but doesn't grant base access.
grant select, insert, update, delete on public.workspaces to authenticated;
grant select, insert, update, delete on public.tool_calls to authenticated;
