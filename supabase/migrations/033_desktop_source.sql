alter table usage_events drop constraint if exists usage_events_source_check;
alter table usage_events add constraint usage_events_source_check
  check (source in ('chat', 'api', 'agents', 'federal_workflow', 'contradiction_scan', 'desktop'));
