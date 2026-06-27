create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users on delete cascade not null,
  title text not null default 'New chat',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid references conversations on delete cascade not null,
  role text not null check (role in ('user', 'assistant')),
  content text not null,
  created_at timestamptz default now() not null
);

create index if not exists conversations_user_id_idx on conversations (user_id, updated_at desc);
create index if not exists messages_conversation_id_idx on messages (conversation_id, created_at asc);

-- RLS
alter table conversations enable row level security;
alter table messages enable row level security;

create policy "Users own conversations"
  on conversations for all
  using (auth.uid() = user_id);

create policy "Users access messages via conversations"
  on messages for all
  using (
    exists (
      select 1 from conversations
      where conversations.id = messages.conversation_id
        and conversations.user_id = auth.uid()
    )
  );
