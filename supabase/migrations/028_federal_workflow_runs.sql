-- Persist federal mission workflow runs for history and export.
create table if not exists federal_workflow_runs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  solution_id text not null,
  input jsonb not null default '{}',
  output jsonb not null,
  document_ids uuid[] not null default '{}',
  input_tokens integer not null default 0,
  output_tokens integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists federal_workflow_runs_user_solution_idx
  on federal_workflow_runs (user_id, solution_id, created_at desc);

alter table federal_workflow_runs enable row level security;

create policy "Users own federal workflow runs"
  on federal_workflow_runs for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Allow agents and federal_workflow in usage tracking.
alter table usage_events drop constraint if exists usage_events_source_check;
alter table usage_events add constraint usage_events_source_check
  check (source in ('chat', 'api', 'agents', 'federal_workflow'));
