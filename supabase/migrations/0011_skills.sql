-- User-installed skills: markdown instructions (Claude Code SKILL.md style)
-- fetched from a GitHub URL and appended to the agent's system prompt.
create table skills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  description text not null default '',
  content text not null,
  source_url text not null,
  created_at timestamptz not null default now()
);

alter table skills enable row level security;

create policy skills_select_own on skills for select using (auth.uid() = user_id);
create policy skills_insert_own on skills for insert with check (auth.uid() = user_id);
create policy skills_delete_own on skills for delete using (auth.uid() = user_id);

-- See 0003_grants.sql: RLS alone doesn't grant base table privileges.
grant select, insert, delete on skills to authenticated;
