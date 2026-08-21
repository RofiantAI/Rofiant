alter table public.conversations
  add column pinned boolean not null default false;
