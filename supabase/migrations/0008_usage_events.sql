-- Token usage per agent run, for the /usage slash command (session + weekly
-- totals). See backend/app/agent/runner.py (usage accumulation) and
-- backend/app/api/usage.py (summary endpoint).

create table public.usage_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  model text not null,
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now()
);

create index usage_events_user_id_created_at_idx on public.usage_events (user_id, created_at);
create index usage_events_conversation_id_idx on public.usage_events (conversation_id);

alter table public.usage_events enable row level security;

create policy "usage_events_select_own" on public.usage_events
  for select using (auth.uid() = user_id);

create policy "usage_events_insert_own" on public.usage_events
  for insert with check (auth.uid() = user_id);

grant select, insert, update, delete on public.usage_events to authenticated;
