-- Persistent per-user cloud VM (Fly.io Machine) + bots running on it.
-- See backend/app/services/fly.py, machine.py, and backend/machine-agent/.
--
-- Layout: one user_machines row per user (unique user_id -- enforces
-- exactly one VM per account and doubles as the idempotency lock for
-- concurrent provisioning requests, see ensure_machine()). bots belong to a
-- machine. machine_jobs is the outbox of commands sent to the machine agent
-- daemon (start/stop/restart a bot); machine_events is the inbox of things
-- the agent reported back (heartbeats, bot status changes, errors).
--
-- No secrets table: backend<->agent auth is HMAC-signed per request with
-- MACHINE_AGENT_SIGNING_SECRET (shared, server + VM image only), not a
-- stored per-machine token. Nothing provider-identifying or credential-like
-- is ever selectable by the `authenticated` role.

create table public.user_machines (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users (id) on delete cascade,
  provider text not null default 'fly',
  provider_app_id text,
  provider_machine_id text,
  provider_volume_id text,
  region text,
  status text not null default 'provisioning'
    check (status in ('provisioning', 'starting', 'running', 'stopping', 'stopped', 'error', 'deleting')),
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  last_seen_at timestamptz
);

alter table public.user_machines enable row level security;

-- Read-only for the owner. No insert/update/delete policy for `authenticated`
-- at all, so those stay blocked by RLS's default-deny regardless of the
-- blanket table grant below -- only the service-role backend (which bypasses
-- RLS) can write provider fields and status.
create policy "user_machines_select_own" on public.user_machines
  for select using (auth.uid() = user_id);


create table public.bots (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  machine_id uuid not null references public.user_machines (id) on delete cascade,
  name text not null,
  status text not null default 'creating'
    check (status in ('creating', 'running', 'stopped', 'error', 'deleted')),
  config jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index bots_machine_id_idx on public.bots (machine_id);
create index bots_user_id_idx on public.bots (user_id);

alter table public.bots enable row level security;

create policy "bots_select_own" on public.bots
  for select using (auth.uid() = user_id);

create policy "bots_insert_own" on public.bots
  for insert with check (auth.uid() = user_id);

create policy "bots_update_own" on public.bots
  for update using (auth.uid() = user_id);

create policy "bots_delete_own" on public.bots
  for delete using (auth.uid() = user_id);


create table public.machine_jobs (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.user_machines (id) on delete cascade,
  bot_id uuid references public.bots (id) on delete cascade,
  job_type text not null check (job_type in ('start_bot', 'stop_bot', 'restart_bot')),
  payload jsonb not null default '{}'::jsonb,
  status text not null default 'pending'
    check (status in ('pending', 'sent', 'completed', 'failed')),
  attempts int not null default 0,
  error_message text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index machine_jobs_machine_id_idx on public.machine_jobs (machine_id, status);

alter table public.machine_jobs enable row level security;

-- Server-written outbox; owner can read it (useful for a job-status UI) but
-- never write it directly.
create policy "machine_jobs_select_own" on public.machine_jobs
  for select using (
    exists (
      select 1 from public.user_machines m
      where m.id = machine_id and m.user_id = auth.uid()
    )
  );


create table public.machine_events (
  id uuid primary key default gen_random_uuid(),
  machine_id uuid not null references public.user_machines (id) on delete cascade,
  event_type text not null,
  data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index machine_events_machine_id_idx on public.machine_events (machine_id, created_at);

alter table public.machine_events enable row level security;

create policy "machine_events_select_own" on public.machine_events
  for select using (
    exists (
      select 1 from public.user_machines m
      where m.id = machine_id and m.user_id = auth.uid()
    )
  );

-- Same grant gotcha as 0003 (table grants and RLS are separate layers);
-- 0003's `alter default privileges` already covers new tables, this is just
-- explicit for readability.
grant select, insert, update, delete on public.user_machines to authenticated;
grant select, insert, update, delete on public.bots to authenticated;
grant select, insert, update, delete on public.machine_jobs to authenticated;
grant select, insert, update, delete on public.machine_events to authenticated;
