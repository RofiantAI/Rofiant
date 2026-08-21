-- 0012 granted `authenticated` but not `service_role` on the new tables.
-- service_role bypasses RLS but still needs the base table grant (same
-- gotcha 0003 fixed for the original tables) -- the backend's admin client
-- (app/services/supabase.py get_admin_client) hit "permission denied for
-- table user_machines" (42501) without this.

grant select, insert, update, delete on public.user_machines to service_role;
grant select, insert, update, delete on public.bots to service_role;
grant select, insert, update, delete on public.machine_jobs to service_role;
grant select, insert, update, delete on public.machine_events to service_role;
