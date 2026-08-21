-- Fixes "permission denied for table X" (Postgres 42501): enabling RLS
-- restricts access but does not itself grant the base table privileges a
-- role needs before RLS policies are even consulted. Tables created via the
-- SQL Editor don't inherit these automatically the way Table Editor-created
-- tables do.

grant usage on schema public to authenticated;

grant select, insert, update, delete on public.profiles to authenticated;
grant select, insert, update, delete on public.conversations to authenticated;
grant select, insert, update, delete on public.messages to authenticated;
grant select, insert, update, delete on public.provider_connections to authenticated;

-- Apply the same grant to any table created after this point, so this
-- doesn't have to be remembered for every future migration.
alter default privileges in schema public
  grant select, insert, update, delete on tables to authenticated;
