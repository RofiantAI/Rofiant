-- Health check history for the public status page.
-- Populated by the /api/status/check cron route (service role only).
create table if not exists status_checks (
  id         uuid        primary key default gen_random_uuid(),
  service    text        not null check (service in ('chatAi', 'voiceAi', 'documentIntelligence', 'publicApi', 'dashboard')),
  healthy    boolean     not null,
  latency_ms integer,
  checked_at timestamptz not null default now()
);

create index if not exists status_checks_service_checked_at_idx on status_checks (service, checked_at desc);
create index if not exists status_checks_checked_at_idx on status_checks (checked_at desc);

alter table status_checks enable row level security;

-- Status page is public. Anyone can read check history; only the service role
-- (used by the cron ingest route) can write, so there is no insert policy.
create policy "public_select" on status_checks
  for select using (true);

-- Per-day uptime rollup per service, used to render the 90-day history bar
-- without pulling raw per-check rows on every page load.
create or replace view status_daily_uptime as
select
  service,
  date_trunc('day', checked_at)::date as day,
  count(*)                            as total_checks,
  count(*) filter (where healthy)     as healthy_checks,
  round(avg(latency_ms))              as avg_latency_ms
from status_checks
group by service, date_trunc('day', checked_at)::date;
