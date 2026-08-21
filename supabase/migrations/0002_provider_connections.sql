-- Per-user AI provider connections: Anthropic OAuth (Claude Pro/Max) tokens
-- and bring-your-own API keys (OpenAI). See backend/app/services/anthropic_oauth.py.
--
-- SECURITY NOTE (MVP simplification): access_token / refresh_token / api_key
-- are stored in plaintext, protected only by RLS + Postgres access control.
-- These are live credentials against the user's own paid account/quota — a
-- DB compromise leaks the ability to spend it. Upgrade path: encrypt these
-- columns (pgsodium/Vault, or envelope-encrypt in the backend before writing)
-- before this goes to real users.

create table public.provider_connections (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  provider text not null check (provider in ('anthropic_oauth', 'openai_api_key')),
  access_token text,
  refresh_token text,
  api_key text,
  expires_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, provider)
);

alter table public.provider_connections enable row level security;

create policy "provider_connections_select_own" on public.provider_connections
  for select using (auth.uid() = user_id);

create policy "provider_connections_insert_own" on public.provider_connections
  for insert with check (auth.uid() = user_id);

create policy "provider_connections_update_own" on public.provider_connections
  for update using (auth.uid() = user_id);

create policy "provider_connections_delete_own" on public.provider_connections
  for delete using (auth.uid() = user_id);
