alter table public.messages
  add column if not exists feedback text
  check (feedback in ('up', 'down'));

-- Feedback writes go through the ownership-checked backend endpoint.
grant update on public.messages to service_role;
