-- 0003 is already recorded in production, but its message-table grant was
-- added after that migration ran. Restore the required base privileges;
-- row-level security still limits access to conversations the user owns.
grant usage on schema public to authenticated;
grant select, insert on public.messages to authenticated;
