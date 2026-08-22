-- Agent output is a trusted backend write. Authenticated desktop clients may
-- read their messages but must use the API to append user-role messages.
revoke insert on public.messages from authenticated;
revoke insert, update, delete on public.workspaces from authenticated;
revoke insert, update, delete on public.tool_calls from authenticated;

alter table public.conversations
  add column agent_run_started_at timestamptz;

-- Keep the run lease server-owned even though users may edit ordinary chat
-- metadata through PostgREST.
revoke update on public.conversations from authenticated;
grant update (title, pinned, persona, personas, subtitle, description, notifications_enabled)
  on public.conversations to authenticated;

create or replace function public.claim_conversation_run(
  target_conversation_id uuid,
  target_user_id uuid
) returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare claimed_count integer;
begin
  update public.conversations
  set agent_run_started_at = now()
  where id = target_conversation_id
    and user_id = target_user_id
    and (agent_run_started_at is null or agent_run_started_at < now() - interval '30 minutes');
  get diagnostics claimed_count = row_count;
  return claimed_count > 0;
end;
$$;

create or replace function public.release_conversation_run(
  target_conversation_id uuid,
  target_user_id uuid
) returns void
language sql
security definer
set search_path = public
as $$
  update public.conversations
  set agent_run_started_at = null
  where id = target_conversation_id and user_id = target_user_id;
$$;

revoke all on function public.claim_conversation_run(uuid, uuid) from public, anon, authenticated;
revoke all on function public.release_conversation_run(uuid, uuid) from public, anon, authenticated;
grant execute on function public.claim_conversation_run(uuid, uuid) to service_role;
grant execute on function public.release_conversation_run(uuid, uuid) to service_role;

alter table public.tool_calls add column provider_call_id text;
create unique index tool_calls_provider_call_id_idx
  on public.tool_calls (conversation_id, provider_call_id)
  where provider_call_id is not null;
