-- Per-conversation bot persona. The id maps to a system-prompt suffix in
-- backend/app/agent/prompts.py (PERSONAS); an unknown value falls back to the
-- plain agent prompt, so no FK/enum needed here.
alter table public.conversations
  add column persona text not null default 'agent';
