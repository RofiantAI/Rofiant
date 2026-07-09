alter table agents add column if not exists template_id text;
alter table knowledge_bases add column if not exists template_id text;

create index if not exists agents_user_template_idx
  on agents (user_id, template_id)
  where template_id is not null;

create index if not exists knowledge_bases_owner_template_idx
  on knowledge_bases (owner_id, template_id)
  where template_id is not null;
