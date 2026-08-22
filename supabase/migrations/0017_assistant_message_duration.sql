-- Assistant work duration is measured by the backend and retained with the
-- response so the UI can show it after reload.
alter table public.messages
  add column if not exists duration_ms integer check (duration_ms >= 0);
