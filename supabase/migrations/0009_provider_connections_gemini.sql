-- The settings API supports a user-owned Gemini key, so keep the database's
-- provider allowlist in sync with that public API.
alter table public.provider_connections
  drop constraint provider_connections_provider_check;

alter table public.provider_connections
  add constraint provider_connections_provider_check
  check (provider in ('anthropic_oauth', 'openai_api_key', 'gemini_api_key'));
