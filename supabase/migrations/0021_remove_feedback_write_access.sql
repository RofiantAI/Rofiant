-- Response feedback is delivered through Web3Forms, not stored or consumed by
-- the agent. Remove the no-longer-needed backend update privilege.
revoke update on public.messages from service_role;
