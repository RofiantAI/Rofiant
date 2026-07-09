create table if not exists user_notifications (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        not null references auth.users(id) on delete cascade,
  source_key  text        not null,
  title       text        not null,
  body        text        not null default '',
  href        text,
  read_at     timestamptz,
  created_at  timestamptz not null default now(),
  unique (user_id, source_key)
);

create index if not exists user_notifications_user_unread_idx
  on user_notifications (user_id, read_at, created_at desc);

alter table user_notifications enable row level security;

create policy "own_all" on user_notifications
  for all using (auth.uid() = user_id);
