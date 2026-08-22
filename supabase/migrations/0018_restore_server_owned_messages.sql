-- Message roles are a server-owned trust boundary (see 0014). Migration 0016
-- temporarily restored this grant for the stale production backend; the
-- current backend inserts validated user messages through the service role.
revoke insert, update, delete on public.messages from authenticated;
grant select on public.messages to authenticated;
