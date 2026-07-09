alter table agent_runs drop constraint if exists agent_runs_status_check;

alter table agent_runs
  add constraint agent_runs_status_check
  check (status in ('completed', 'failed', 'pending_approval', 'denied'));

alter table agent_runs add column if not exists pipeline_state jsonb not null default '{}';
