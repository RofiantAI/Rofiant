-- The service role bypasses RLS but still needs PostgreSQL table privileges.
-- Grant only the operations used by the backend's trusted admin client.
grant select, insert on public.messages to service_role;
grant select, insert on public.usage_events to service_role;
grant select, insert on public.tool_calls to service_role;
grant select, insert on public.workspaces to service_role;
grant select, update on public.conversations to service_role;
