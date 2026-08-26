-- A user-supplied OpenAI-compatible endpoint (self-hosted or third-party),
-- not tied to a specific vendor. Needs base_url and model alongside the
-- existing api_key column, which no other provider row uses.
alter table public.provider_connections
  add column base_url text,
  add column model text;

alter table public.provider_connections
  drop constraint provider_connections_provider_check;

alter table public.provider_connections
  add constraint provider_connections_provider_check
  check (provider in ('anthropic_oauth', 'openai_api_key', 'gemini_api_key', 'custom_openai'));
