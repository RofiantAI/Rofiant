-- Per-bot settings surfaced in the titlebar settings panel: a short subtitle,
-- a longer free-text description, and a run-finished notification toggle.
alter table public.conversations
  add column subtitle text,
  add column description text,
  add column notifications_enabled boolean not null default false;
